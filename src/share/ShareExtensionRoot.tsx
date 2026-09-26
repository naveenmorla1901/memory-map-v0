import React from 'react';
import { close, openHostApp, type InitialProps } from 'expo-share-extension';

import { OverlayApp } from './OverlayApp';

/**
 * iOS Share Extension root (its own JS bundle - see index.share.js). Runs
 * on top of Instagram: reads the shared session from the keychain group,
 * analyzes the reel, and saves without ever leaving Instagram.
 */
export default function ShareExtensionRoot(props: InitialProps) {
  return (
    <OverlayApp
      presentation="embedded"
      shared={props.url || props.text}
      onClose={close}
      openApp={(path) => openHostApp(path)}
    />
  );
}
