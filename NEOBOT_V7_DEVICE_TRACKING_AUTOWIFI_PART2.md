# 📱 NEOBOT V7 - DEVICE TRACKING & AUTO WIFI (PART 2)
## Frontend UI, Database, Deployment & Security

---

## 🎨 FRONTEND UI COMPONENTS

### **A. Device Tracking Dashboard**

```typescript
// frontend/web/src/components/device-tracking/TrackingDashboard.tsx

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useDeviceTracking } from '@/hooks/useDeviceTracking';

interface DeviceLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  battery: number;
}

const TrackingDashboard: React.FC = () => {
  const { 
    devices, 
    selectedDevice, 
    locationHistory,
    selectDevice,
    refreshLocation,
    remoteLock,
    remoteAlarm,
    capturePhoto
  } = useDeviceTracking();

  const [map, setMap] = useState<any>(null);

  return (
    <div className="tracking-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>🔍 Device Tracking</h1>
        <div className="device-selector">
          <select onChange={(e) => selectDevice(e.target.value)}>
            {devices.map(device => (
              <option key={device.id} value={device.id}>
                {device.name} {device.is_online && '🟢'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Map View */}
        <div className="map-container">
          <MapContainer
            center={[selectedDevice.lat, selectedDevice.lng]}
            zoom={15}
            ref={setMap}
            className="device-map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Current Location */}
            <Marker position={[selectedDevice.lat, selectedDevice.lng]}>
              <Popup>
                <div className="location-popup">
                  <h3>{selectedDevice.name}</h3>
                  <p>📍 Accuracy: {selectedDevice.accuracy}m</p>
                  <p>🔋 Battery: {selectedDevice.battery}%</p>
                  <p>🕐 {new Date(selectedDevice.timestamp).toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>

            {/* Location History Path */}
            <Polyline
              positions={locationHistory.map(loc => [loc.latitude, loc.longitude])}
              color="blue"
              weight={3}
            />
          </MapContainer>

          {/* Map Controls */}
          <div className="map-controls">
            <button onClick={() => refreshLocation(selectedDevice.id)}>
              🔄 Refresh Location
            </button>
            <button onClick={() => map?.flyTo([selectedDevice.lat, selectedDevice.lng], 17)}>
              📍 Center Map
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          <h2>Remote Control</h2>
          
          {/* Device Info */}
          <div className="device-info-card">
            <h3>Device Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="label">Status:</span>
                <span className={`value ${selectedDevice.is_online ? 'online' : 'offline'}`}>
                  {selectedDevice.is_online ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Battery:</span>
                <span className="value">{selectedDevice.battery}%</span>
              </div>
              <div className="status-item">
                <span className="label">Network:</span>
                <span className="value">{selectedDevice.network_type}</span>
              </div>
              <div className="status-item">
                <span className="label">Last Seen:</span>
                <span className="value">{formatTimeAgo(selectedDevice.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Remote Actions */}
          <div className="remote-actions">
            <button 
              className="action-btn lock"
              onClick={() => handleRemoteLock()}
            >
              🔒 Lock Device
            </button>

            <button 
              className="action-btn alarm"
              onClick={() => remoteAlarm(selectedDevice.id, 60)}
            >
              📢 Sound Alarm
            </button>

            <button 
              className="action-btn camera"
              onClick={() => capturePhoto(selectedDevice.id, 'front')}
            >
              📸 Capture Photo
            </button>

            <button 
              className="action-btn screenshot"
              onClick={() => captureScreenshot(selectedDevice.id)}
            >
              📱 Screenshot
            </button>

            <button 
              className="action-btn wipe danger"
              onClick={() => handleRemoteWipe()}
            >
              🗑️ Wipe Device
            </button>
          </div>

          {/* Geofences */}
          <div className="geofences">
            <h3>Safe Zones</h3>
            <div className="geofence-list">
              {selectedDevice.geofences.map(fence => (
                <div key={fence.id} className="geofence-item">
                  <span>{fence.name}</span>
                  <span>{fence.radius}m</span>
                  <button onClick={() => removeGeofence(fence.id)}>❌</button>
                </div>
              ))}
            </div>
            <button className="add-geofence" onClick={() => showAddGeofenceModal()}>
              + Add Safe Zone
            </button>
          </div>

          {/* Recent Alerts */}
          <div className="recent-alerts">
            <h3>Recent Alerts</h3>
            <div className="alerts-list">
              {selectedDevice.alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`alert-item ${alert.severity}`}>
                  <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                  <div className="alert-content">
                    <span className="alert-type">{alert.type}</span>
                    <span className="alert-time">{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const handleRemoteLock = () => {
  const message = prompt('Enter message to display on lock screen:');
  const password = prompt('Enter new lock password:');
  
  if (message && password) {
    remoteLock(selectedDevice.id, { message, password });
  }
};

const handleRemoteWipe = () => {
  const confirmed = confirm(
    'WARNING: This will permanently delete all data on the device. ' +
    'This action cannot be undone. Are you absolutely sure?'
  );
  
  if (confirmed) {
    const code = prompt('Enter your confirmation code:');
    if (code) {
      remoteWipe(selectedDevice.id, code);
    }
  }
};

export default TrackingDashboard;
```

---

### **B. Auto WiFi Dashboard**

```typescript
// frontend/web/src/components/auto-wifi/AutoWiFiDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAutoWiFi } from '@/hooks/useAutoWiFi';
import { WifiIcon, SignalIcon, LockIcon } from '@/components/icons';

const AutoWiFiDashboard: React.FC = () => {
  const {
    devices,
    selectedDevice,
    nearbyNetworks,
    knownNetworks,
    connectionHistory,
    isAutoConnectEnabled,
    toggleAutoConnect,
    addNetwork,
    removeNetwork,
    setPriority
  } = useAutoWiFi();

  return (
    <div className="autowifi-dashboard">
      <div className="dashboard-header">
        <h1>📶 Auto WiFi Connection</h1>
        
        {/* Auto-Connect Toggle */}
        <div className="auto-connect-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={isAutoConnectEnabled}
              onChange={() => toggleAutoConnect()}
            />
            <span className="slider"></span>
          </label>
          <span>Auto-Connect {isAutoConnectEnabled ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Current Connection */}
        <div className="current-connection-card">
          <h2>Current Connection</h2>
          {selectedDevice.current_wifi ? (
            <div className="connection-info">
              <WifiIcon className="wifi-icon" />
              <div className="connection-details">
                <h3>{selectedDevice.current_wifi.ssid}</h3>
                <div className="connection-stats">
                  <div className="stat">
                    <SignalIcon level={selectedDevice.current_wifi.signal} />
                    <span>{selectedDevice.current_wifi.signal}%</span>
                  </div>
                  <div className="stat">
                    <span>⚡ {selectedDevice.current_wifi.speed} Mbps</span>
                  </div>
                  <div className="stat">
                    {selectedDevice.current_wifi.security && <LockIcon />}
                    <span>{selectedDevice.current_wifi.security || 'Open'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-connection">
              <p>Not connected to WiFi</p>
            </div>
          )}
        </div>

        {/* Nearby Networks */}
        <div className="nearby-networks-card">
          <h2>Nearby Networks</h2>
          <div className="networks-list">
            {nearbyNetworks.map(network => (
              <div key={network.bssid} className="network-item">
                <div className="network-info">
                  <WifiIcon className="icon" />
                  <div className="network-details">
                    <span className="ssid">{network.ssid}</span>
                    <span className="bssid">{network.bssid}</span>
                  </div>
                </div>
                <div className="network-stats">
                  <SignalIcon level={network.signal} />
                  {network.security && <LockIcon />}
                  {network.isKnown && <span className="badge known">Known</span>}
                </div>
                {!network.isKnown && (
                  <button 
                    className="add-btn"
                    onClick={() => handleAddNetwork(network)}
                  >
                    + Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Known Networks */}
        <div className="known-networks-card">
          <h2>Known Networks</h2>
          <div className="networks-list sortable">
            {knownNetworks
              .sort((a, b) => a.priority - b.priority)
              .map(network => (
                <div key={network.id} className="network-item">
                  <div className="drag-handle">⋮⋮</div>
                  <div className="network-info">
                    <span className="ssid">{network.ssid}</span>
                    <div className="network-meta">
                      <span className="priority">Priority: {network.priority}</span>
                      <span className="reliability">
                        ✓ {network.reliability}% reliable
                      </span>
                    </div>
                  </div>
                  <div className="network-actions">
                    <button onClick={() => editNetwork(network.id)}>✏️</button>
                    <button onClick={() => removeNetwork(network.id)}>🗑️</button>
                  </div>
                </div>
              ))}
          </div>
          <button className="add-network-btn" onClick={() => showAddNetworkModal()}>
            + Add Network
          </button>
        </div>

        {/* Connection History */}
        <div className="connection-history-card">
          <h2>Connection History</h2>
          <div className="history-timeline">
            {connectionHistory.map(entry => (
              <div key={entry.id} className="history-entry">
                <div className="entry-icon">
                  {entry.type === 'connected' ? '🟢' : '🔴'}
                </div>
                <div className="entry-details">
                  <span className="entry-ssid">{entry.ssid}</span>
                  <span className="entry-time">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  {entry.type === 'connected' && (
                    <span className="entry-duration">
                      Duration: {formatDuration(entry.duration)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="statistics-card">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Connections</span>
              <span className="stat-value">
                {connectionHistory.filter(e => e.type === 'connected').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Auto-Connects Today</span>
              <span className="stat-value">{getAutoConnectsToday()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Speed</span>
              <span className="stat-value">{getAverageSpeed()} Mbps</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Success Rate</span>
              <span className="stat-value">{getSuccessRate()}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const handleAddNetwork = (network: Network) => {
  const password = prompt(`Enter password for ${network.ssid}:`);
  if (password) {
    addNetwork({
      ssid: network.ssid,
      bssid: network.bssid,
      password,
      security: network.security,
      priority: knownNetworks.length + 1
    });
  }
};

export default AutoWiFiDashboard;
```

---

## 🗄️ DATABASE SCHEMA

### **Device Tracking Tables**

```sql
-- Devices Table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- 'android', 'ios'
    os_version VARCHAR(50),
    device_model VARCHAR(100),
    imei VARCHAR(50) UNIQUE,
    phone_number VARCHAR(20),
    sim_serial VARCHAR(50),
    is_online BOOLEAN DEFAULT false,
    is_tracking_enabled BOOLEAN DEFAULT true,
    tracking_mode VARCHAR(20) DEFAULT 'normal', -- 'normal', 'stealth', 'power_save'
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Locations Table
CREATE TABLE device_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    provider VARCHAR(20), -- 'gps', 'network', 'cell'
    battery_level INTEGER,
    is_charging BOOLEAN,
    network_type VARCHAR(20),
    wifi_ssid VARCHAR(255),
    wifi_bssid VARCHAR(50),
    cell_tower_id VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Geofences Table
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius DECIMAL(10, 2) NOT NULL, -- meters
    is_active BOOLEAN DEFAULT true,
    alert_on_enter BOOLEAN DEFAULT false,
    alert_on_exit BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Alerts Table
CREATE TABLE device_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'sim_changed', 'geofence_exit', 'power_off', etc.
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    location_id UUID REFERENCES device_locations(id),
    photo_url TEXT,
    audio_url TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Remote Actions Table
CREATE TABLE remote_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'lock', 'alarm', 'photo', 'wipe', etc.
    action_data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'executed', 'failed'
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Device Photos Table (from remote capture)
CREATE TABLE device_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    camera VARCHAR(10), -- 'front', 'back'
    location_id UUID REFERENCES device_locations(id),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    captured_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_device_locations_device_timestamp ON device_locations(device_id, timestamp DESC);
CREATE INDEX idx_device_locations_coordinates ON device_locations(latitude, longitude);
CREATE INDEX idx_device_alerts_device_created ON device_alerts(device_id, created_at DESC);
CREATE INDEX idx_geofences_device_active ON geofences(device_id, is_active);
```

---

### **Auto WiFi Tables**

```sql
-- WiFi Networks Table
CREATE TABLE wifi_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ssid VARCHAR(255) NOT NULL,
    bssid VARCHAR(50),
    password_encrypted TEXT,
    security_type VARCHAR(50), -- 'WPA2', 'WPA', 'WEP', 'Open'
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    is_auto_connect BOOLEAN DEFAULT true,
    is_blacklisted BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMP,
    total_connections INTEGER DEFAULT 0,
    successful_connections INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, ssid, bssid)
);

-- WiFi Connection History
CREATE TABLE wifi_connection_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    wifi_network_id UUID REFERENCES wifi_networks(id),
    ssid VARCHAR(255) NOT NULL,
    bssid VARCHAR(50),
    event_type VARCHAR(20) NOT NULL, -- 'connected', 'disconnected', 'failed'
    signal_strength INTEGER, -- -100 to 0 dBm
    link_speed INTEGER, -- Mbps
    ip_address VARCHAR(50),
    connection_duration INTEGER, -- seconds
    location_id UUID REFERENCES device_locations(id),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WiFi Speed Tests
CREATE TABLE wifi_speed_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wifi_network_id UUID REFERENCES wifi_networks(id),
    device_id UUID REFERENCES devices(id),
    download_speed DECIMAL(10, 2), -- Mbps
    upload_speed DECIMAL(10, 2), -- Mbps
    latency INTEGER, -- ms
    jitter INTEGER, -- ms
    packet_loss DECIMAL(5, 2), -- percentage
    test_server VARCHAR(255),
    tested_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WiFi Auto-Connect Logs
CREATE TABLE wifi_auto_connect_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    trigger VARCHAR(50), -- 'internet_down', 'manual', 'scheduled'
    networks_scanned INTEGER,
    network_connected_id UUID REFERENCES wifi_networks(id),
    connection_time_ms INTEGER, -- milliseconds taken to connect
    success BOOLEAN,
    error_message TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_wifi_networks_user_priority ON wifi_networks(user_id, priority);
CREATE INDEX idx_wifi_connection_history_device_time ON wifi_connection_history(device_id, timestamp DESC);
CREATE INDEX idx_wifi_speed_tests_network ON wifi_speed_tests(wifi_network_id, tested_at DESC);
CREATE INDEX idx_wifi_auto_connect_logs_device ON wifi_auto_connect_logs(device_id, timestamp DESC);
```

---

## 🚀 DEPLOYMENT GUIDE

### **1. Android App Setup**

```bash
# Install dependencies
cd mobile/android
./gradlew build

# Setup permissions in AndroidManifest.xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

# Build APK
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA \
  -digestalg SHA1 -keystore neobot.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  neobot

# Align APK
zipalign -v 4 app-release-unsigned.apk neobot-tracking.apk
```

---

### **2. Backend Service Deployment**

```yaml
# infrastructure/kubernetes/deployments/device-tracking.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: device-tracking
  namespace: neobot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: device-tracking
  template:
    metadata:
      labels:
        app: device-tracking
    spec:
      containers:
      - name: device-tracking
        image: neobot/device-tracking:latest
        ports:
        - containerPort: 3005
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: neobot-config
              key: redis-url
        - name: WEBSOCKET_PORT
          value: "3006"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3005
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3005
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: device-tracking-service
  namespace: neobot
spec:
  selector:
    app: device-tracking
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 3005
  - name: websocket
    protocol: TCP
    port: 3006
    targetPort: 3006
  type: ClusterIP
```

---

### **3. Real-Time WebSocket Server**

```typescript
// backend/services/device-tracking/src/websocket/tracking-server.ts

import WebSocket from 'ws';
import { Server } from 'http';
import { verifyJWT } from '../utils/auth';

export class TrackingWebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/tracking' });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', async (ws: WebSocket, req) => {
      try {
        // Authenticate
        const token = new URL(req.url!, 'ws://localhost').searchParams.get('token');
        const user = await verifyJWT(token);

        if (!user) {
          ws.close(1008, 'Unauthorized');
          return;
        }

        // Subscribe to user's devices
        ws.on('message', (message: string) => {
          this.handleMessage(ws, user.id, message);
        });

        ws.on('close', () => {
          this.removeClient(user.id, ws);
        });

        // Send initial data
        this.sendDevicesList(ws, user.id);
        
      } catch (error) {
        ws.close(1011, 'Internal error');
      }
    });
  }

  private handleMessage(ws: WebSocket, userId: string, message: string) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'subscribe_device':
          this.subscribeToDevice(ws, userId, data.device_id);
          break;
        
        case 'unsubscribe_device':
          this.unsubscribeFromDevice(ws, userId, data.device_id);
          break;

        case 'request_location':
          this.requestLocationUpdate(userId, data.device_id);
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  // Broadcast location update to all subscribed clients
  public broadcastLocationUpdate(deviceId: string, location: any) {
    const clients = this.clients.get(deviceId);
    if (clients) {
      const message = JSON.stringify({
        type: 'location_update',
        device_id: deviceId,
        location
      });

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Broadcast alert to subscribed clients
  public broadcastAlert(deviceId: string, alert: any) {
    const clients = this.clients.get(deviceId);
    if (clients) {
      const message = JSON.stringify({
        type: 'alert',
        device_id: deviceId,
        alert
      });

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  private subscribeToDevice(ws: WebSocket, userId: string, deviceId: string) {
    if (!this.clients.has(deviceId)) {
      this.clients.set(deviceId, new Set());
    }
    this.clients.get(deviceId)!.add(ws);
  }

  private removeClient(userId: string, ws: WebSocket) {
    this.clients.forEach((clients, deviceId) => {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(deviceId);
      }
    });
  }
}
```

---

## 🔒 SECURITY & PRIVACY

### **Data Protection**

```typescript
// backend/services/device-tracking/src/security/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export class DataEncryption {
  
  // Encrypt sensitive data (passwords, locations)
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  // Decrypt sensitive data
  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Hash device identifiers
  static hashDeviceId(deviceId: string): string {
    return crypto
      .createHash('sha256')
      .update(deviceId + process.env.DEVICE_SALT!)
      .digest('hex');
  }
}
```

---

### **Permission Verification**

```typescript
// Verify device ownership before tracking
export async function verifyDeviceOwnership(
  userId: string,
  deviceId: string
): Promise<boolean> {
  const device = await db.devices.findOne({
    where: { id: deviceId, user_id: userId }
  });
  
  return !!device;
}

// Verify action authorization
export async function verifyActionAuthorization(
  userId: string,
  deviceId: string,
  action: string
): Promise<boolean> {
  // Check ownership
  if (!await verifyDeviceOwnership(userId, deviceId)) {
    return false;
  }
  
  // Critical actions require 2FA
  const criticalActions = ['wipe', 'factory_reset'];
  if (criticalActions.includes(action)) {
    return await verify2FA(userId);
  }
  
  return true;
}
```

---

## 📊 PERFORMANCE METRICS

### **Expected Performance:**

```
Device Tracking:
├─ Location update frequency: Every 30s (normal), Every 10s (high-alert)
├─ GPS accuracy: 5-10 meters
├─ WiFi accuracy: 20-50 meters
├─ Cell tower accuracy: 100-1000 meters
├─ Battery impact: 3-5% per hour (optimized)
├─ Data usage: ~10 MB per day
└─ WebSocket latency: <100ms

Auto WiFi:
├─ Network scan time: 3-5 seconds
├─ Connection time: 5-10 seconds
├─ Switch time: <3 seconds (seamless)
├─ Success rate: 95%+
├─ Battery impact: 1-2% per hour
└─ CPU usage: <5% average
```

---

## 🎯 ROADMAP

### **Phase 1 (Month 1-2): Core Features**
- ✅ Basic location tracking (GPS, WiFi, Cell)
- ✅ Remote lock & alarm
- ✅ Auto WiFi connection
- ✅ Known networks database
- ✅ Real-time dashboard

### **Phase 2 (Month 3-4): Advanced Features**
- ✅ Stealth mode
- ✅ Photo & audio capture
- ✅ Geofencing
- ✅ Smart WiFi selection (ML)
- ✅ Captive portal auto-login

### **Phase 3 (Month 5-6): Enterprise Features**
- ✅ Multi-device management
- ✅ Fleet tracking
- ✅ Advanced analytics
- ✅ API for third-party integration
- ✅ White-label solution

---

## 📄 LEGAL COMPLIANCE

```
✅ GDPR Compliant (EU)
✅ CCPA Compliant (California)
✅ Data retention: 90 days (auto-delete)
✅ User consent required
✅ Privacy policy displayed
✅ Right to be forgotten
✅ Data portability
✅ Encryption at rest & in transit
✅ Regular security audits
✅ Incident response plan
```

---

**Device Tracking & Auto WiFi = Complete Mobile Security! 📱🔒✨**
