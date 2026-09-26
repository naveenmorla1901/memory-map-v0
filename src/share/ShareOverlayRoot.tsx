import React, { useEffect } from 'react';
import { BackHandler, Linking } from 'react-native';

import { URL_SCHEME } from '../config';
import { OverlayApp } from './OverlayApp';

interface Props {
  /** Intent.EXTRA_TEXT from the share - set by ShareOverlayActivity (plugins/withAndroidShareOverlay.js). */
  text?: string;
}

/**
 * Android share target root. Runs in a translucent activity over Instagram;
 * finishing the activity drops the user straight back into Instagram.
 */
export default function ShareOverlayRoot({ text }: Props) {
  const close = () => BackHandler.exitApp();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => subscription.remove();
  }, []);

  return (
    <OverlayApp
      presentation="sheet"
      shared={text}
      onClose={close}
      openApp={(path) => {
        Linking.openURL(`${URL_SCHEME}://${path}`).finally(close);
      }}
    />
  );
}
