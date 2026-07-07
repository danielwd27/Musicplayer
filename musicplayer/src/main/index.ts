import { app, shell, BrowserWindow, ipcMain, dialog, Menu, MenuItemConstructorOptions, protocol, net } from 'electron'
import { pathToFileURL } from 'url'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initializeDatabase, insertTrack, getAllTracks, getAllPlaylists, getPlaylistTracks, createPlaylist, addTracksToPlaylist, updatePlaylist,
        deletePlaylist, removeTrackFromPlaylist, deleteTrack } from './database'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import path from 'path'
import { parseFile } from 'music-metadata'
import os from 'os'
import crypto from 'crypto'

// Helper function to extract metadata and save album art
async function processAudioFile(filePath: string, filename: string): Promise<void> {
  let duration: number | undefined
  let title: string | undefined
  let artist: string | undefined
  let album: string | undefined
  let year: number | undefined
  let albumImagePath: string | null = null

  try {
    const metadata = await parseFile(filePath)
    duration = metadata.format.duration
    title = metadata.common.title
    artist = metadata.common.albumartist
    album = metadata.common.album
    year = metadata.common.year

    // Extract and save album art if available
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0]
      const tempDir = os.tmpdir()
      const fileName = `album-${crypto.randomBytes(8).toString('hex')}.${picture.format.split('/')[1] || 'jpg'}`
      albumImagePath = join(tempDir, fileName)
      
      try {
        await fs.writeFile(albumImagePath, picture.data)
      } catch (err) {
        console.error(`Failed to save album art for ${filename}:`, err)
        albumImagePath = null
      }
    }
  } catch (err) {
    console.error(`Failed to read metadata for ${filePath}:`, err)
  }

  insertTrack(filePath, filename, duration, title, artist, album, year, albumImagePath)
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    minWidth: 900,
    width: 1000,
    minHeight: 500,
    height: 670,
    show: false,
    icon: icon,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
      secure: true,
      standard: true
    }
  }
])

app.whenReady().then(() => {
  protocol.handle('local', (request) => {
    // 1. Parse the incoming request as a proper URL object
    const requestUrl = new URL(request.url)
    
    // 2. Safely extract our file path from the query parameter
    const decodedPath = requestUrl.searchParams.get('path')
    
    // Fallback if something goes wrong
    if (!decodedPath) {
      console.error("No path provided to local protocol")
      return new Response('Bad Request', { status: 400 })
    }
    
    // 3. Convert to file:// and stream it using net.fetch
    return net.fetch(pathToFileURL(decodedPath).toString())
  })
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  initializeDatabase()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.handle('db:getPlaylists', () => {
    return getAllPlaylists()
  })

  // Notice we pass the playlistId from React to the database here
  ipcMain.handle('db:getPlaylistTracks', (_, playlistId: number) => {
    return getPlaylistTracks(playlistId)
  })

  ipcMain.handle('db:getLibrary', () => {
    return getAllTracks()
  })

  ipcMain.handle('db:createPlaylist', (_, name: string, desc: string, coverImagePath: string | null) => {
    return createPlaylist(name, desc, coverImagePath) // Returns the new ID!
  })

  ipcMain.handle('db:addTracksToPlaylist', (_, playlistId: number, trackIds: number[]) => {
    addTracksToPlaylist(playlistId, trackIds)
    return true
  })

  ipcMain.handle('db:updatePlaylist', (_, id: number, name: string, desc: string, coverImage: string | null) => {
    return updatePlaylist(id, name, desc, coverImage)
  })

  ipcMain.handle('db:deletePlaylist', (_, id: number) => {
    return deletePlaylist(id)
  })

  ipcMain.handle('db:removeTrackFromPlaylist', (_, playlistId: number, trackId: number) => {
    return removeTrackFromPlaylist(playlistId, trackId)
  })

  ipcMain.handle('db:deleteTrack', (_, trackId: number) => {
    return deleteTrack(trackId)
  })

  ipcMain.handle('dialog:selectImage', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
      ]
    })
    if (canceled || filePaths.length === 0) return null
    return filePaths[0] // Return the selected file path
  })

  ipcMain.handle('dialog:openFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'aac'] }
      ]
    })

    if (canceled || filePaths.length === 0) return []

    const supportedExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac']

    for (const filePath of filePaths) {
      const ext = path.extname(filePath).toLowerCase()
      if (!supportedExtensions.includes(ext)) continue

      const filename = path.basename(filePath)
      await processAudioFile(filePath, filename)
    }

    return getAllTracks()
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (canceled || filePaths.length === 0) return []

    const folderPath = filePaths[0]

    try {
      const allFiles = await fs.readdir(folderPath, { recursive: true })
      const supportedExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac']

      for (const file of allFiles) {
        const ext = path.extname(file).toLowerCase()
        if (supportedExtensions.includes(ext)) {
          const fullPath = path.join(folderPath, file)
          const filename = path.basename(file)
          await processAudioFile(fullPath, filename)
        }
      }

      return getAllTracks() 
    } catch (error) {
      console.error("Failed to read directory:", error)
      return []
    }
  })

  // --- MENU SETUP ---
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New Playlist',
          accelerator: 'CmdOrCtrl+N',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow()
            if (mainWindow) {
              mainWindow.webContents.send('create-playlist')
            }
          }
         },
        {
          label: 'Import File',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow()
            if (mainWindow) {
              mainWindow.webContents.send('import-file')
            }
          }
        },
        {
          label: 'Import Folder',
          accelerator: 'CmdOrCtrl+O', 
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow()
            if (mainWindow) {
              mainWindow.webContents.send('scan-folder')
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Playback',
      submenu: [
        { label: 'Play/Pause', accelerator: 'Space',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow()
            if (mainWindow) {
              mainWindow.webContents.send('play-pause')
            }
          }
         },
        { label: 'Next Track', accelerator: 'CmdOrCtrl+Right',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow()
            if (mainWindow) {
              mainWindow.webContents.send('next-track')
            }
          }
         },
        { label: 'Previous Track', accelerator: 'CmdOrCtrl+Left',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow()
            if (mainWindow) {
              mainWindow.webContents.send('prev-track')
            }
          }
         },
         { label: 'Mute/Unmute', accelerator: 'CmdOrCtrl+M',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow()
            if (mainWindow) {
              mainWindow.webContents.send('toggle-mute')
            }
          }
         }
      ]
    },
    {
      label: 'Appearance'
    }
  ]
  
  const customMenu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(customMenu)
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})