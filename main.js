const { app, BrowserWindow } = require('electron');
const path = require('path');

// Variable global para mantener la referencia a la ventana
let mainWindow;

function createWindow () {
  // 1. Configuración de la ventana de Windows
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Pizzería Colombianita", // El título que saldrá en la ventana
    icon: path.join(__dirname, 'app_angular', 'Pizzeria_Colimbianita', 'browser', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 2. Ruta exacta al compilado de Angular (El paso más crítico)
  // IMPORTANTE: Revisa tu carpeta "dist". 
  // - Si tienes Angular 17 o superior, la ruta lleva "/browser/index.html"
  // - Si tienes una versión anterior, quita "/browser" y déjalo solo como "/index.html"
  const angularAppPath = path.join(__dirname, 'app_angular', 'Pizzeria_Colimbianita', 'browser', 'index.html');
  
  // Cargar el archivo HTML de Angular
  mainWindow.loadFile(angularAppPath);

  // 3. HERRAMIENTA DE DIAGNÓSTICO (Los Rayos X) 🕵🏻‍♀️
  // Si la pantalla sigue saliendo en blanco, quítale las dos barras '//' a la línea de abajo 
  // para abrir la consola y ver el error exacto:
  
  // mainWindow.webContents.openDevTools();

  // Ocultar el menú superior (Archivo, Edición, Ver) para que parezca un software más profesional
  mainWindow.setMenuBarVisibility(false);

  // Opcional: Cuando la ventana termine de cargar, la mostramos
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// 4. Ciclo de vida de la aplicación Electron
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // Si la app sigue abierta pero no hay ventanas (común en macOS), crea una nueva
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 5. Cerrar los procesos cuando el usuario da clic en la 'X' roja
app.on('window-all-closed', function () {
  // En Windows y Linux, cerrar todas las ventanas apaga el programa completo
  if (process.platform !== 'darwin') app.quit();
});