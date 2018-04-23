"use strict";

const electron =  require('electron')
// Module to control application life.
const app = electron.app

const path= require("path");
const url= require("url");

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

global.sharedObj={forceClose:true,params:null,error:""};

function update_app(version)
{
  var request = require('request');
   try{
    if (process.platform === 'win32')
      mainWindow.loadURL(`//${__dirname}/updating.html`);
    else
      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'updating.html'),
        protocol: 'file',
        slashes: true
      }));
    request("http://storage.cloudspace.com.my/get_updates.php?os=win&version="+version, function (error, response, body) 
    {       
      if (!error && response.statusCode == 200) 
      {
        //console.log(body);
        var arr=JSON.parse(body);
        if(arr.res=="OK")
        {
          if (process.platform === 'win32')
            mainWindow.loadURL(`//${__dirname}/index.html`);
          else
            mainWindow.loadURL(url.format({
              pathname: path.join(__dirname, 'index.html'),
              protocol: 'file',
              slashes: true
            }));
          global.sharedObj.forceClose=false;

          global.sharedObj.params=process.argv.slice(1);

          for(var i=0;i<global.sharedObj.params.length;i++)
          {
            var param=global.sharedObj.params[i];
            if(param=="--hide")
            {
              var x=global.sharedObj.params[i+1];
              i++;
              if(x=="true")
              {
                //ocultar app
                mainWindow.hide();
              }
            }
          }

        }
        else if(arr.res=="INSTALL")
        {
          global.sharedObj.url=arr.url;
          if (process.platform === 'win32')
            mainWindow.loadURL(`//${__dirname}/reinstall.html`);
          else
            mainWindow.loadURL(url.format({
              pathname: path.join(__dirname, 'reinstall.html'),
              protocol: 'file',
              slashes: true
            }));
        }
        else if(arr.res=="UPDATE")
        {
          var nupdates=0;
          var nerrors=0;
          var nkeys=0;
          var needs_restart=false;
          var needs_superuser=false;
          for(var key in arr.updates)
          {
            nkeys++;
          }
          for(var key in arr.updates)
          {
            var update_url=arr.updates[key];
            function actualizar(url,fichero,onEnd)
            {
              var requestSettings = {
                method: 'GET',
                url: url,
                encoding: null
              };
              request(requestSettings, function(error,response,body) {
                if (!error && response.statusCode == 200) {
                  var path=__dirname;
                  if (process.platform === "win32")
                    path+="\\"+fichero;
                  else
                    path+="/"+fichero;
                  //console.log(fichero);
                  if(fichero=="main.js")
                  {
                    needs_restart=true;
                  }
                  try
                  {
                    var fs = require('fs');
                    fs.writeFileSync(path, body);
                  }
                  catch(e)
                  {
                    nerrors++;
                    needs_superuser=true;
                  }
                }
                else
                  nerrors++;
                nupdates++;
                onEnd();
              });
            }

            actualizar(update_url,key,function(){
              if(nupdates>=nkeys)
              {
                if(nerrors==0)
                {
                  if(needs_restart)
                  {
                    if (process.platform === 'win32')
                      mainWindow.loadURL(`//${__dirname}/restart.html`);   
                    else
                      mainWindow.loadURL(url.format({
                        pathname: path.join(__dirname, 'restart.html'),
                        protocol: 'file',
                        slashes: true
                      }));                 
                  }
                  else
                  {
                    if (process.platform === 'win32')
                      mainWindow.loadURL(`//${__dirname}/index.html`);
                    else
                      mainWindow.loadURL(url.format({
                        pathname: path.join(__dirname, 'index.html'),
                        protocol: 'file',
                        slashes: true
                      }));
                    global.sharedObj.forceClose=false;
                    
                  }
                }
                else if(needs_superuser)
                {
                  if (process.platform === 'win32')
                    mainWindow.loadURL(`//${__dirname}/restart_superuser.html`);
                  else
                    mainWindow.loadURL(url.format({
                      pathname: path.join(__dirname, 'restart_superuser.html'),
                      protocol: 'file',
                      slashes: true
                    }));
                }
                else
                {
                  if (process.platform === 'win32')
                    mainWindow.loadURL(`//${__dirname}/failed.html`);
                  else
                    mainWindow.loadURL(url.format({
                      pathname: path.join(__dirname, 'failed.html'),
                      protocol: 'file',
                      slashes: true
                    }));
                }
              }
            })
          }          
        }
        
      }
      else if (error)
      {
        global.sharedObj.error=error;
        setTimeout(function() {update_app(version)},4500);
      }
    });
  }
  catch(e)
  {
    console.log("Update failed" + e);  
    setTimeout(function() {update_app(version)},500);
  }//end try
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 900, height: 600, icon:__dirname + '/app_icon_16 32 48 256_icon.ico'})
  

  
  var fs = require('fs');
  try{
    var pjson = require('./package.json');
    //console.log("version: "+pjson.version);
    var version = pjson.version;
  }
  catch(e){
    version="0.0.0";
  }
  if(!version)
    version="0.0.0";
  
  
  var autoupdate=true;
  //var autoupdate=false;
  if(autoupdate)
  {
    update_app(version);
  }
  else
  {
    // and load the index.html of the app.
    if (process.platform === 'win32')
      mainWindow.loadURL(`//${__dirname}/index.html`);    
    else
       mainWindow.loadURL(url.format({
                      pathname: path.join(__dirname, 'index.html'),
                      protocol: 'file',
                      slashes: true
                    }));
    global.sharedObj.forceClose=false;
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    
  })

  mainWindow.on('close', function (e) {
    if(!global.sharedObj.forceClose)
    {
      if (process.platform === "darwin") 
      {
        e.preventDefault();
        mainWindow.hide();
        app.dock.hide();
      }
      else
      {
        e.preventDefault();
        mainWindow.hide();
      }
      
      
      
    }
    else{
      mainWindow=null;
      if (process.platform === 'darwin') {
        //app.quit()
      }
    }
  });

  app.on('before-quit', () => global.sharedObj.forceClose = true);




}


var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
  return;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
