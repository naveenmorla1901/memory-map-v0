import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, errorMessage } from '../api/client';
import { placesApi } from '../api/endpoints';
import type { Place, PlaceInput, PlacePatch } from '../api/types';
import { useToast } from '../ui/Toast';
import { useAuth } from './auth';
import { initialPlacesState, placesReducer, PlacesState } from './placesReducer';

interface PlacesContextValue extends PlacesState {
  refresh: () => Promise<void>;
  getPlace: (id: string) => Place | undefined;
  create: (input: PlaceInput) => Promise<Place>;
  createMany: (inputs: PlaceInput[]) => Promise<Place[]>;
  /** Applies immediately and rolls back if the server rejects it. */
  update: (id: string, patch: PlacePatch) => Promise<Place>;
  /** Removes immediately with an Undo toast; the server delete happens after the undo window. */
  remove: (place: Place) => void;
}

const PlacesContext = createContext<PlacesContextValue | null>(null);

const UNDO_WINDOW_MS = 4500;
const cacheKey = (userId: number) => `mm.places.v1.${userId}`;

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const { user, status: authStatus } = useAuth();
  const toast = useToast();
  const [state, dispatch] = useReducer(placesReducer, initialPlacesState);
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const stateRef = useRef(state);
  stateRef.current = state;
  const userId = user?.id;
  const previousUserId = useRef<number | undefined>(undefined);

  // Persist the latest list so the app opens instantly and works offline.
  useEffect(() => {
    if (userId && state.status === 'ready' && !state.stale) {
      AsyncStorage.setItem(cacheKey(userId), JSON.stringify(state.places)).catch(() => {});
    }
  }, [state, userId]);

  const refresh = useCallback(async () => {
    try {
      const places = await placesApi.list();
      dispatch({ type: 'loaded', places: places.filter((place) => !pendingDeletes.current.has(place.id)) });
    } catch (error) {
      dispatch({ type: 'failed', error: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'signedOut') {
      // Don't leave a previous account's places on the device.
      if (previousUserId.current) AsyncStorage.removeItem(cacheKey(previousUserId.current)).catch(() => {});
      previousUserId.current = undefined;
      dispatch({ type: 'reset' });
      return;
    }
    if (!userId) return;
    previousUserId.current = userId;
    let active = true;
    dispatch({ type: 'reset' });
    AsyncStorage.getItem(cacheKey(userId))
      .then((raw) => {
        if (active && raw) dispatch({ type: 'cached', places: JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        if (active) refresh();
      });
    return () => {
      active = false;
    };
  }, [authStatus, userId, refresh]);

  const getPlace = useCallback((id: string) => stateRef.current.places.find((place) => place.id === id), []);

  const create = useCallback(async (input: PlaceInput) => {
    const place = await placesApi.create(input);
    dispatch({ type: 'upsert', places: [place] });
    return place;
  }, []);

  const createMany = useCallback(async (inputs: PlaceInput[]) => {
    const places = await placesApi.createMany(inputs);
    dispatch({ type: 'upsert', places });
    return places;
  }, []);

  const update = useCallback(async (id: string, patch: PlacePatch) => {
    const before = stateRef.current.places.find((place) => place.id === id);
    if (before) dispatch({ type: 'upsert', places: [{ ...before, ...patch, updated_at: new Date().toISOString() }] });
    try {
      const saved = await placesApi.update(id, patch);
      dispatch({ type: 'upsert', places: [saved] });
      return saved;
    } catch (error) {
      if (before) dispatch({ type: 'upsert', places: [before] });
      if (error instanceof ApiError && error.status === 404) dispatch({ type: 'remove', id });
      throw error;
    }
  }, []);

  const remove = useCallback(
    (place: Place) => {
      dispatch({ type: 'remove', id: place.id });
      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(place.id);
        try {
          await placesApi.remove(place.id);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return; // Already gone.
          dispatch({ type: 'upsert', places: [place] });
          toast({ kind: 'error', message: `Couldn't delete ${place.name}. ${errorMessage(error)}` });
        }
      }, UNDO_WINDOW_MS);
      pendingDeletes.current.set(place.id, timer);
      toast({
        message: `Deleted ${place.name}`,
        durationMs: UNDO_WINDOW_MS,
        action: {
          label: 'Undo',
          onPress: () => {
            clearTimeout(timer);
            pendingDeletes.current.delete(place.id);
            dispatch({ type: 'upsert', places: [place] });
          },
        },
      });
    },
    [toast],
  );

  const value = useMemo(
    () => ({ ...state, refresh, getPlace, create, createMany, update, remove }),
    [state, refresh, getPlace, create, createMany, update, remove],
  );
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces(): PlacesContextValue {
  const context = useContext(PlacesContext);
  if (!context) throw new Error('usePlaces must be used inside PlacesProvider');
  return context;
}

/** One place by id, kept current as the list changes. */
export function usePlace(id: string): Place | undefined {
  const { places } = usePlaces();
  return useMemo(() => places.find((place) => place.id === id), [places, id]);
}
