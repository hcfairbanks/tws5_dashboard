'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { networkInterfaces } = require('os');

// Read the API key from the specified file
// const apiKeyPath = 'C:\\Users\\<YOUR_USER_HERE>\\Documents\\My Games\\TrainSimWorld5\\Saved\\Config\\CommAPIKey.txt';
const windows_users_folder = process.env.USERPROFILE || 'DefaultUser';
const apiKeyPath = path.join(windows_users_folder, 'Documents', 'My Games', 'TrainSimWorld5', 'Saved', 'Config', 'CommAPIKey.txt');

// Set to true for miles, false for kilometers
const useMiles = false;

/**
 * Gets the internal IP address of this machine
 */
function getInternalIpAddress() {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is a string in Node <= 17, from 18 it's a number 4
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;

      if (net.family === familyV4Value && !net.internal) {
        return net.address; // Return the first matching address
      }
    }
  }
  return null; // Return null if no suitable IP is found
}

// Speed conversion factor: m/s to km/h = 3.6, m/s to mph = 2.23694
const speedConversionFactor = useMiles ? 2.23694 : 3.6;

// Distance conversion factor: cm to meters = 100, cm to feet = 30.48
const distanceConversionFactor = useMiles ? 30.48 : 100;

/**
 * Waits for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempts to read and validate the API key, retrying until valid
 */
async function waitForValidApiKey() {
    let apiKey = '';
    while (!apiKey) {
        try {
            apiKey = fs.readFileSync(apiKeyPath, 'utf8').trim();
            if (!apiKey) {
                throw new Error('CommAPIKey key is empty');
            }
            console.log('CommAPIKey Key loaded successfully');
            return apiKey;
        } catch (err) {
            console.log('Waiting for TSW CommAPIKey ...');
            await sleep(3000);
        }
    }
}

let apiKey = '';
// Wait for valid API key before starting server
(async () => {
    apiKey = await waitForValidApiKey();

/**
 * Deletes the existing subscription before creating new ones
 */
async function deleteSubscription() {
    console.log('Deleting old subscription...');
    try {
        const config = {
            method: 'delete',
            maxBodyLength: Infinity,
            url: 'http://localhost:31270/subscription?Subscription=1',
            headers: { 
                'DTGCommKey': apiKey
            }
        };
        const response = await axios.request(config);
        console.log('Old subscription deleted successfully');
    } catch (err) {
        console.error('Failed to delete old subscription, old subscription may not exist. Error Message:', err.message);
    }
}

// Flag to track if subscriptions have been created
let subscriptionsCreated = false;

// Array of subscription endpoints to create
const subscriptionEndpoints = [
    '/subscription/DriverAid.Data?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetSpeed?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetDirection?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetPowerHandle?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetIsSlipping?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetBrakeGauge_1?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetBrakeGauge_2?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetAcceleration?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetSpeedControlTarget?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetMaxPermittedSpeed?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetAlerter?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetAmmeter?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetTractiveEffort?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetEngineRPM?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetGearIndex?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetElectricBrakeHandle?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetLocomotiveBrakeHandle?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetTrainBrakeHandle?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetIsTractionLocked?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetSteamBoilerPressure?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetSteamChestPressure?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetCylinderCocks?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetBoilerWaterLevel?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetFireboxCoalLevel?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetBlowerFlow?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetDamperFlow?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetReverserCutoff?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetWaterTankLevel?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetCoalBunkerLevel?Subscription=1',
    '/subscription/CurrentDrivableActor.Function.HUD_GetIsSteamRequired?Subscription=1'
];

/**
 * Creates subscriptions for all endpoints in the subscriptionEndpoints array
 * Only creates subscriptions once
 */
async function createSubscriptions() {
    if (subscriptionsCreated) {
        console.log('Subscriptions already created, skipping...');
        return;
    }
    
    console.log('Creating subscriptions...');
    for (const endpoint of subscriptionEndpoints) {
        try {
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `http://localhost:31270${endpoint}`,
                headers: { 
                    'DTGCommKey': apiKey
                }
            };
            const response = await axios.request(config);
            console.log(`Subscription created for ${endpoint}`);
        } catch (err) {
          console.error(`Failed to create subscription ${endpoint}:`, err.message);
        }
        
        // Wait 1/4 second between each subscription request
        await sleep(250);
    }
    subscriptionsCreated = true;
    console.log('All subscriptions created');
}

const server = http.createServer((req, res) => {
  // 1. Serve the HTML page
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } 
  // 2. The SSE Stream (The "Push" connection)
  else if (req.url === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  
  );

      console.log('Starting data stream...');
      
      // Fetch and send data every 500ms
      const interval = setInterval(async () => {
        try {
          // Call Train Sim World subscription feed API
          const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'http://localhost:31270/subscription/?Subscription=1',
            headers: { 
              'DTGCommKey': apiKey
            }
          };
          
          const response = await axios.request(config);
          const rawData = response.data;
          
          // Parse Train Sim World API response and format for frontend
          const formattedData = {
            speed: 0,
            limit: 120,
            incline: 0,
            nextSpeedLimit: 0,
            distanceToNextSpeedLimit: 0,
            powerHandle: 0,
            direction: 0,
            isSlipping: false,
            brakeGauge1: 0,
            brakeGauge2: 0,
            acceleration: 0,
            speedControlTarget: 0,
            maxPermittedSpeed: 0,
            alerter: 0,
            ammeter: 0,
            tractiveEffort: 0,
            engineRPM: 0,
            gearIndex: 0,
            electricBrakeHandle: 0,
            electricDynamicBrake: 0,
            electricBrakeActive: false,
            locomotiveBrakeHandle: 0,
            locomotiveBrakeActive: false,
            trainBrakeHandle: 0,
            trainBreak: 0,
            trainBrakeActive: false,
            isTractionLocked: false,
            steamBoilerPressure: 0,
            steamChestPressure: 0,
            cylinderCocks: 0,
            boilerWaterLevel: 0,
            fireboxCoalLevel: 0,
            blowerFlow: 0,
            damperFlow: 0,
            reverserCutoff: 0,
            waterTankLevel: 0,
            coalBunkerLevel: 0,
            isSteamRequired: false,
            raw: rawData
          };
          
          if (rawData.Entries && rawData.Entries.length > 0) {
            for (const entry of rawData.Entries) {
              if (entry.NodeValid && entry.Values) {
                // Extract speed from HUD_GetSpeed
                if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetSpeed' && entry.Values['Speed (ms)']) {
                  // Convert m/s to km/h or mph
                  formattedData.speed = Math.round(entry.Values['Speed (ms)'] * speedConversionFactor);
                  // console.log('Fetched speed from TSW:', formattedData.speed);
                }
                // Extract power handle value
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetPowerHandle' && entry.Values['Power'] !== undefined) {
                  const powerValue = entry.Values['Power'];
                  const isNegative = entry.Values['IsNegative'];
                  // If IsNegative field exists and is true, make the value negative
                  // Otherwise, use the Power value as-is (it may already be negative)
                  // Round up using Math.ceil for positive values, Math.floor for negative values
                  const roundedValue = powerValue >= 0 ? Math.ceil(powerValue) : Math.floor(powerValue);
                  formattedData.powerHandle = (isNegative === true) ? -Math.abs(roundedValue) : roundedValue;
                }
                // Extract direction
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetDirection' && entry.Values['Direction'] !== undefined) {
                  formattedData.direction = entry.Values['Direction'];
                }
                // Extract is slipping
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetIsSlipping' && entry.Values['IsSlipping'] !== undefined) {
                  formattedData.isSlipping = entry.Values['IsSlipping'];
                }
                // Extract brake gauges
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetBrakeGauge_1' && entry.Values['BrakeGauge'] !== undefined) {
                  formattedData.brakeGauge1 = entry.Values['BrakeGauge'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetBrakeGauge_2' && entry.Values['BrakeGauge'] !== undefined) {
                  formattedData.brakeGauge2 = entry.Values['BrakeGauge'];
                }
                // Extract acceleration
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetAcceleration' && entry.Values['Acceleration'] !== undefined) {
                  formattedData.acceleration = entry.Values['Acceleration'];
                }
                // Extract speed control target
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetSpeedControlTarget' && entry.Values['SpeedControlTarget'] !== undefined) {
                  formattedData.speedControlTarget = Math.round(entry.Values['SpeedControlTarget'] * speedConversionFactor);
                }
                // Extract max permitted speed
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetMaxPermittedSpeed' && entry.Values['MaxPermittedSpeed'] !== undefined) {
                  formattedData.maxPermittedSpeed = Math.round(entry.Values['MaxPermittedSpeed'] * speedConversionFactor);
                }
                // Extract alerter
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetAlerter' && entry.Values['Alerter'] !== undefined) {
                  formattedData.alerter = entry.Values['Alerter'];
                }
                // Extract ammeter
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetAmmeter' && entry.Values['Ammeter'] !== undefined) {
                  formattedData.ammeter = entry.Values['Ammeter'];
                }
                // Extract tractive effort
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetTractiveEffort' && entry.Values['TractiveEffort'] !== undefined) {
                  formattedData.tractiveEffort = entry.Values['TractiveEffort'];
                }
                // Extract engine RPM
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetEngineRPM' && entry.Values['EngineRPM'] !== undefined) {
                  formattedData.engineRPM = Math.round(entry.Values['EngineRPM']);
                }
                // Extract gear index
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetGearIndex' && entry.Values['GearIndex'] !== undefined) {
                  formattedData.gearIndex = entry.Values['GearIndex'];
                }
                // Extract brake handles
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetElectricBrakeHandle' && entry.Values['HandlePosition'] !== undefined) {
                  formattedData.electricBrakeHandle = entry.Values['HandlePosition'];
                  // Convert to percentage
                  formattedData.electricDynamicBrake = Math.round(entry.Values['HandlePosition'] * 100);
                  formattedData.electricBrakeActive = entry.Values['IsActive'] || false;
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetLocomotiveBrakeHandle' && entry.Values['HandlePosition'] !== undefined) {
                  formattedData.locomotiveBrakeHandle = entry.Values['HandlePosition'];
                  formattedData.locomotiveBrakeActive = entry.Values['IsActive'] || false;
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetTrainBrakeHandle' && entry.Values['HandlePosition'] !== undefined) {
                  formattedData.trainBrakeHandle = entry.Values['HandlePosition'];
                  formattedData.trainBreak = Math.round(entry.Values['HandlePosition'] * 100);
                  formattedData.trainBrakeActive = entry.Values['IsActive'] || false;
                }
                // Extract is traction locked
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetIsTractionLocked' && entry.Values['IsTractionLocked'] !== undefined) {
                  formattedData.isTractionLocked = entry.Values['IsTractionLocked'];
                }
                // Steam locomotive specific data
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetSteamBoilerPressure' && entry.Values['SteamBoilerPressure'] !== undefined) {
                  formattedData.steamBoilerPressure = entry.Values['SteamBoilerPressure'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetSteamChestPressure' && entry.Values['SteamChestPressure'] !== undefined) {
                  formattedData.steamChestPressure = entry.Values['SteamChestPressure'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetCylinderCocks' && entry.Values['CylinderCocks'] !== undefined) {
                  formattedData.cylinderCocks = entry.Values['CylinderCocks'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetBoilerWaterLevel' && entry.Values['BoilerWaterLevel'] !== undefined) {
                  formattedData.boilerWaterLevel = entry.Values['BoilerWaterLevel'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetFireboxCoalLevel' && entry.Values['FireboxCoalLevel'] !== undefined) {
                  formattedData.fireboxCoalLevel = entry.Values['FireboxCoalLevel'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetBlowerFlow' && entry.Values['BlowerFlow'] !== undefined) {
                  formattedData.blowerFlow = entry.Values['BlowerFlow'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetDamperFlow' && entry.Values['DamperFlow'] !== undefined) {
                  formattedData.damperFlow = entry.Values['DamperFlow'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetReverserCutoff' && entry.Values['ReverserCutoff'] !== undefined) {
                  formattedData.reverserCutoff = entry.Values['ReverserCutoff'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetWaterTankLevel' && entry.Values['WaterTankLevel'] !== undefined) {
                  formattedData.waterTankLevel = entry.Values['WaterTankLevel'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetCoalBunkerLevel' && entry.Values['CoalBunkerLevel'] !== undefined) {
                  formattedData.coalBunkerLevel = entry.Values['CoalBunkerLevel'];
                }
                else if (entry.Path === 'CurrentDrivableActor.Function.HUD_GetIsSteamRequired' && entry.Values['IsSteamRequired'] !== undefined) {
                  formattedData.isSteamRequired = entry.Values['IsSteamRequired'];
                }
                // Extract speed limit and gradient from DriverAid.Data
                else if (entry.Path === 'DriverAid.Data') {
                  if (entry.Values['speedLimit'] && entry.Values['speedLimit']['value']) {
                    // Convert m/s to km/h or mph
                    formattedData.limit = Math.round(entry.Values['speedLimit']['value'] * speedConversionFactor);
                  }
                  if (entry.Values['gradient'] !== undefined) {
                    formattedData.incline = parseFloat(entry.Values['gradient'].toFixed(1));
                  }
                  if (entry.Values['nextSpeedLimit'] && entry.Values['nextSpeedLimit']['value']) {
                    // Convert m/s to km/h or mph
                    formattedData.nextSpeedLimit = Math.round(entry.Values['nextSpeedLimit']['value'] * speedConversionFactor);
                  }
                  if (entry.Values['distanceToNextSpeedLimit'] !== undefined) {
                    // Convert cm to meters or feet depending on unit preference
                    formattedData.distanceToNextSpeedLimit = Math.round(entry.Values['distanceToNextSpeedLimit'] / distanceConversionFactor);
                  }
                }
              }
            }
          }

          // SSE format requires "data: " prefix and two newlines at the end
          res.write(`data: ${JSON.stringify(formattedData)}\n\n`);
        } catch (err) {
          res.write(`data: {"error": "Failed to fetch TSW data: ${err.message}"}\n\n`);
        }
      }, 500);

      // Stop the interval if the user closes the tab
      req.on('close', () => clearInterval(interval));
  }else if (req.url === '/default.css') {
    // Handle CSS file request
    res.setHeader('Content-Type', 'text/css');
    res.statusCode = 0o100;
    res.end(fs.readFileSync('css/default.css'));
  }
});

// Delete old subscription and create new subscriptions once before starting the server
deleteSubscription().then(() => {
  return createSubscriptions();
}).then(() => {
  const port = 3000;
  server.listen(port, '0.0.0.0', () => {
    const myIp = getInternalIpAddress();
    console.log('Server running locally at http://localhost:' + port);
    if (myIp) {
      console.log('Server accessible on local network at http://' + myIp + ':' + port);
    }
  });
});

})();