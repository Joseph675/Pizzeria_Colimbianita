/***************************************************************************************************
 * BUNDLE SHIM PARA sockjs-client
 *
 * `sockjs-client` y otras librerías de Node esperan que exista `global`. En el navegador no existe,
 * así que lo apuntamos a `window` para evitar el error:
 *
 *    ReferenceError: global is not defined
 *
 **************************************************************************************************/
(window as any).global = window;

// Luego importamos los polyfills estándar de Angular/Zone.js si los necesitas:
// import 'zone.js';  // ya lo tienes en angular.json
