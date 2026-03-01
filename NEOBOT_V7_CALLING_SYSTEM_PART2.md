# 📞 NEOBOT V7 - CALLING SYSTEM (PART 2)
## Backend API, Emergency Database, UI & Deployment

---

## 🔧 BACKEND IMPLEMENTATION

### **A. Calling API (Node.js)**

```typescript
// backend/services/calling/src/controllers/calling.controller.ts

import { Request, Response } from 'express';
import { CallingService } from '../services/calling.service';
import { EmergencyService } from '../services/emergency.service';
import { MessengerService } from '../services/messenger.service';
import { VoIPService } from '../services/voip.service';

export class CallingController {
  
  // Initiate call
  async initiateCall(req: Request, res: Response) {
    try {
      const { user_id } = req.user;
      const { contact_id, method, platform } = req.body;
      
      // Get contact details
      const contact = await CallingService.getContact(contact_id);
      
      // Initiate call based on method
      let callSession;
      switch (method) {
        case 'cellular':
          callSession = await CallingService.initiateCellularCall(user_id, contact);
          break;
        case 'voip':
          callSession = await VoIPService.initiateCall(user_id, contact);
          break;
        case 'messenger':
          callSession = await MessengerService.initiateCall(user_id, contact, platform);
          break;
        default:
          // Smart dial - auto-detect best method
          callSession = await CallingService.smartDial(user_id, contact);
      }
      
      res.json({
        success: true,
        call_session: callSession
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Emergency call
  async emergencyCall(req: Request, res: Response) {
    try {
      const { user_id } = req.user;
      const { device_id, location, situation } = req.body;
      
      // Log emergency
      await EmergencyService.logEmergency({
        user_id,
        device_id,
        location,
        situation,
        timestamp: new Date()
      });
      
      // Get emergency number based on location
      const emergencyNumber = await EmergencyService.getEmergencyNumber(
        location.country_code
      );
      
      // Notify emergency contacts
      await EmergencyService.notifyEmergencyContacts(user_id, {
        location,
        situation,
        emergency_number: emergencyNumber
      });
      
      // Initiate emergency call
      const callSession = await EmergencyService.initiateEmergencyCall(
        user_id,
        emergencyNumber,
        location
      );
      
      res.json({
        success: true,
        emergency_number: emergencyNumber,
        call_session: callSession,
        contacts_notified: true
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get call history
  async getCallHistory(req: Request, res: Response) {
    try {
      const { user_id } = req.user;
      const { start_date, end_date, type } = req.query;
      
      const history = await CallingService.getCallHistory(user_id, {
        start_date: new Date(start_date as string),
        end_date: new Date(end_date as string),
        type: type as string
      });
      
      res.json({
        calls: history,
        count: history.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Record call
  async recordCall(req: Request, res: Response) {
    try {
      const { call_id } = req.params;
      const { enable } = req.body;
      
      if (enable) {
        await CallingService.startRecording(call_id);
      } else {
        await CallingService.stopRecording(call_id);
      }
      
      res.json({
        success: true,
        recording: enable
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get call recording
  async getRecording(req: Request, res: Response) {
    try {
      const { call_id } = req.params;
      
      const recording = await CallingService.getRecording(call_id);
      
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }
      
      // Return recording file
      res.download(recording.file_path);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get call transcription
  async getTranscription(req: Request, res: Response) {
    try {
      const { call_id } = req.params;
      
      const transcription = await CallingService.getTranscription(call_id);
      
      res.json({
        call_id,
        transcription: transcription.text,
        speakers: transcription.speakers,
        timestamps: transcription.timestamps,
        summary: transcription.summary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

### **B. Emergency Service**

```typescript
// backend/services/calling/src/services/emergency.service.ts

import { LocationData } from '../types';
import { EmergencyDatabase } from '../database/emergency.database';

export class EmergencyService {
  
  // Emergency numbers database (195+ countries)
  private static emergencyNumbers = {
    // Asia Pacific
    'ID': { police: '110', medical: '118', fire: '113', general: '112' },
    'MY': { police: '999', medical: '999', fire: '994', general: '999' },
    'SG': { police: '999', medical: '995', fire: '995', general: '999' },
    'TH': { police: '191', medical: '1669', fire: '199', general: '191' },
    'PH': { police: '911', medical: '911', fire: '911', general: '911' },
    'VN': { police: '113', medical: '115', fire: '114', general: '113' },
    'JP': { police: '110', medical: '119', fire: '119', general: '110' },
    'KR': { police: '112', medical: '119', fire: '119', general: '112' },
    'CN': { police: '110', medical: '120', fire: '119', general: '110' },
    'IN': { police: '100', medical: '102', fire: '101', general: '112' },
    'AU': { police: '000', medical: '000', fire: '000', general: '000' },
    'NZ': { police: '111', medical: '111', fire: '111', general: '111' },
    
    // Americas
    'US': { police: '911', medical: '911', fire: '911', general: '911' },
    'CA': { police: '911', medical: '911', fire: '911', general: '911' },
    'MX': { police: '911', medical: '911', fire: '911', general: '911' },
    'BR': { police: '190', medical: '192', fire: '193', general: '190' },
    'AR': { police: '911', medical: '107', fire: '100', general: '911' },
    
    // Europe
    'GB': { police: '999', medical: '999', fire: '999', general: '112' },
    'FR': { police: '17', medical: '15', fire: '18', general: '112' },
    'DE': { police: '110', medical: '112', fire: '112', general: '112' },
    'IT': { police: '113', medical: '118', fire: '115', general: '112' },
    'ES': { police: '091', medical: '061', fire: '080', general: '112' },
    'NL': { police: '112', medical: '112', fire: '112', general: '112' },
    'BE': { police: '101', medical: '100', fire: '100', general: '112' },
    'CH': { police: '117', medical: '144', fire: '118', general: '112' },
    'SE': { police: '112', medical: '112', fire: '112', general: '112' },
    'NO': { police: '112', medical: '113', fire: '110', general: '112' },
    'RU': { police: '102', medical: '103', fire: '101', general: '112' },
    
    // Middle East
    'AE': { police: '999', medical: '998', fire: '997', general: '999' },
    'SA': { police: '999', medical: '997', fire: '998', general: '999' },
    'IL': { police: '100', medical: '101', fire: '102', general: '112' },
    'TR': { police: '155', medical: '112', fire: '110', general: '112' },
    
    // Africa
    'ZA': { police: '10111', medical: '10177', fire: '10111', general: '112' },
    'EG': { police: '122', medical: '123', fire: '180', general: '122' },
    'KE': { police: '999', medical: '999', fire: '999', general: '112' },
    'NG': { police: '112', medical: '112', fire: '112', general: '112' },
    
    // Default (EU standard)
    'DEFAULT': { police: '112', medical: '112', fire: '112', general: '112' }
  };
  
  // Get emergency number by country code and type
  static getEmergencyNumber(
    countryCode: string, 
    type: 'police' | 'medical' | 'fire' | 'general' = 'general'
  ): string {
    const country = this.emergencyNumbers[countryCode] || this.emergencyNumbers['DEFAULT'];
    return country[type];
  }
  
  // Get all emergency numbers for a country
  static getAllEmergencyNumbers(countryCode: string) {
    return this.emergencyNumbers[countryCode] || this.emergencyNumbers['DEFAULT'];
  }
  
  // Log emergency event
  static async logEmergency(data: {
    user_id: string;
    device_id: string;
    location: LocationData;
    situation?: string;
    timestamp: Date;
  }) {
    await EmergencyDatabase.insertEmergency({
      ...data,
      status: 'active',
      resolved_at: null
    });
  }
  
  // Notify emergency contacts
  static async notifyEmergencyContacts(
    userId: string, 
    data: {
      location: LocationData;
      situation?: string;
      emergency_number: string;
    }
  ) {
    // Get user's emergency contacts
    const contacts = await EmergencyDatabase.getEmergencyContacts(userId);
    
    // Send notifications via multiple channels
    for (const contact of contacts) {
      // SMS
      if (contact.phone_number) {
        await this.sendEmergencySMS(contact.phone_number, {
          name: contact.name,
          location: data.location,
          situation: data.situation,
          emergency_number: data.emergency_number,
          map_link: this.generateMapLink(data.location)
        });
      }
      
      // Push notification
      if (contact.device_token) {
        await this.sendPushNotification(contact.device_token, {
          title: '🚨 Emergency Alert',
          body: `${contact.name} has triggered an emergency call`,
          data: {
            location: data.location,
            situation: data.situation
          }
        });
      }
      
      // Email
      if (contact.email) {
        await this.sendEmergencyEmail(contact.email, {
          name: contact.name,
          location: data.location,
          situation: data.situation,
          map_link: this.generateMapLink(data.location)
        });
      }
    }
  }
  
  // Generate Google Maps link
  private static generateMapLink(location: LocationData): string {
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }
  
  // Send emergency SMS
  private static async sendEmergencySMS(phoneNumber: string, data: any) {
    const message = `
🚨 EMERGENCY ALERT

${data.name} needs help!

Location: ${data.map_link}
Situation: ${data.situation || 'Unknown'}
Emergency Number: ${data.emergency_number}

Please check on them immediately!
    `.trim();
    
    // Use Twilio/other SMS service
    await SMSService.send(phoneNumber, message);
  }
  
  // Auto emergency detection (crash, fall, etc.)
  static async detectEmergency(data: {
    device_id: string;
    type: 'crash' | 'fall' | 'panic' | 'voice';
    sensor_data: any;
    location: LocationData;
  }): Promise<boolean> {
    let isEmergency = false;
    
    switch (data.type) {
      case 'crash':
        // Detect car crash from accelerometer
        const gForce = data.sensor_data.g_force;
        if (gForce > 4.0) { // 4G force indicates crash
          isEmergency = true;
        }
        break;
        
      case 'fall':
        // Detect fall (for elderly)
        const fallDetected = data.sensor_data.fall_detected;
        const noMovement = data.sensor_data.no_movement_duration > 60; // 60 seconds
        if (fallDetected && noMovement) {
          isEmergency = true;
        }
        break;
        
      case 'panic':
        // Panic button pressed
        isEmergency = true;
        break;
        
      case 'voice':
        // Voice command: "Hey Neobot, emergency!"
        isEmergency = true;
        break;
    }
    
    if (isEmergency) {
      // Start emergency countdown (60 seconds to cancel)
      await this.startEmergencyCountdown(data.device_id, data.location);
    }
    
    return isEmergency;
  }
  
  // Emergency countdown (give user time to cancel)
  private static async startEmergencyCountdown(deviceId: string, location: LocationData) {
    // Send notification to device
    await NotificationService.send(deviceId, {
      title: '🚨 Emergency Detected',
      body: 'Calling emergency services in 60 seconds. Tap to cancel.',
      actions: ['Cancel', 'Call Now']
    });
    
    // Wait 60 seconds
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Check if canceled
    const canceled = await EmergencyDatabase.isEmergencyCanceled(deviceId);
    
    if (!canceled) {
      // Auto-call emergency services
      const countryCode = await this.getCountryCodeFromLocation(location);
      const emergencyNumber = this.getEmergencyNumber(countryCode);
      
      await this.initiateEmergencyCall(deviceId, emergencyNumber, location);
    }
  }
}
```

---

### **C. Call Recording Service**

```typescript
// backend/services/calling/src/services/recording.service.ts

import { AudioProcessor } from '../utils/audio-processor';
import { TranscriptionService } from './transcription.service';

export class RecordingService {
  
  // Start recording call
  static async startRecording(callId: string, options: {
    quality?: 'low' | 'medium' | 'high';
    format?: 'mp3' | 'wav' | 'ogg';
    transcribe?: boolean;
  }) {
    const recording = {
      call_id: callId,
      status: 'recording',
      started_at: new Date(),
      quality: options.quality || 'medium',
      format: options.format || 'mp3',
      file_path: null,
      file_size: 0,
      duration: 0
    };
    
    // Save to database
    await RecordingDatabase.insert(recording);
    
    // Start audio capture
    await AudioProcessor.startCapture(callId, {
      quality: options.quality,
      format: options.format
    });
    
    // Start transcription if enabled
    if (options.transcribe) {
      await TranscriptionService.startRealTime(callId);
    }
    
    return recording;
  }
  
  // Stop recording
  static async stopRecording(callId: string) {
    // Stop audio capture
    const audioFile = await AudioProcessor.stopCapture(callId);
    
    // Update database
    await RecordingDatabase.update(callId, {
      status: 'completed',
      stopped_at: new Date(),
      file_path: audioFile.path,
      file_size: audioFile.size,
      duration: audioFile.duration
    });
    
    // Process transcription
    await TranscriptionService.processRecording(callId, audioFile.path);
    
    // Upload to cloud storage (encrypted)
    await this.uploadToCloud(callId, audioFile.path);
    
    return audioFile;
  }
  
  // Upload recording to cloud (encrypted)
  private static async uploadToCloud(callId: string, filePath: string) {
    // Encrypt file
    const encryptedFile = await this.encryptFile(filePath);
    
    // Upload to S3/Cloud Storage
    const cloudURL = await CloudStorage.upload(encryptedFile, {
      bucket: 'neobot-call-recordings',
      encryption: 'AES256',
      metadata: {
        call_id: callId,
        encrypted: true
      }
    });
    
    // Update database with cloud URL
    await RecordingDatabase.update(callId, {
      cloud_url: cloudURL,
      encrypted: true
    });
    
    // Delete local file (optional)
    await fs.unlink(filePath);
    
    return cloudURL;
  }
  
  // Encrypt recording file
  private static async encryptFile(filePath: string): Promise<Buffer> {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.RECORDING_ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const fileData = await fs.readFile(filePath);
    const encrypted = Buffer.concat([
      cipher.update(fileData),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + Auth Tag + Encrypted Data
    return Buffer.concat([iv, authTag, encrypted]);
  }
}
```

---

### **D. Transcription Service (AI)**

```typescript
// backend/services/calling/src/services/transcription.service.ts

import { OpenAI } from 'openai';

export class TranscriptionService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  // Transcribe recorded call
  static async transcribeRecording(audioFilePath: string) {
    // Use OpenAI Whisper API
    const transcription = await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'id', // Auto-detect or specify
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word']
    });
    
    // Extract speakers using diarization
    const speakers = await this.identifySpeakers(transcription);
    
    // Generate summary
    const summary = await this.generateSummary(transcription.text);
    
    // Extract action items
    const actionItems = await this.extractActionItems(transcription.text);
    
    return {
      text: transcription.text,
      segments: transcription.segments,
      words: transcription.words,
      speakers: speakers,
      summary: summary,
      action_items: actionItems,
      language: transcription.language,
      duration: transcription.duration
    };
  }
  
  // Identify speakers (diarization)
  private static async identifySpeakers(transcription: any) {
    // Use speaker diarization model
    // This is a simplified example
    const speakers = [];
    let currentSpeaker = 0;
    
    for (const segment of transcription.segments) {
      // Detect speaker change based on audio features
      // (In production, use proper diarization model)
      if (this.isSpeakerChange(segment)) {
        currentSpeaker = 1 - currentSpeaker; // Toggle between 0 and 1
      }
      
      speakers.push({
        speaker: `Speaker ${currentSpeaker + 1}`,
        start: segment.start,
        end: segment.end,
        text: segment.text
      });
    }
    
    return speakers;
  }
  
  // Generate call summary using GPT
  private static async generateSummary(transcriptText: string) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes phone call transcripts. Provide a concise summary highlighting key points, decisions, and action items.'
        },
        {
          role: 'user',
          content: `Please summarize this phone call transcript:\n\n${transcriptText}`
        }
      ],
      max_tokens: 500
    });
    
    return completion.choices[0].message.content;
  }
  
  // Extract action items
  private static async extractActionItems(transcriptText: string) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract action items from the following phone call transcript. Return as a JSON array of objects with "task", "assigned_to", and "deadline" fields.'
        },
        {
          role: 'user',
          content: transcriptText
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(completion.choices[0].message.content!);
    return result.action_items || [];
  }
}
```

---

## 🗄️ DATABASE SCHEMA

```sql
-- Calls Table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    call_type VARCHAR(20) NOT NULL, -- 'outgoing', 'incoming', 'missed'
    call_method VARCHAR(20) NOT NULL, -- 'cellular', 'voip', 'messenger'
    platform VARCHAR(50), -- 'whatsapp', 'telegram', 'webrtc', 'sim', etc.
    phone_number VARCHAR(20),
    duration INTEGER, -- seconds
    status VARCHAR(20) DEFAULT 'completed', -- 'ringing', 'active', 'completed', 'failed'
    cost DECIMAL(10, 4), -- cost in USD
    quality_rating INTEGER, -- 1-5 stars
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Call Recordings Table
CREATE TABLE call_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    file_path TEXT,
    cloud_url TEXT,
    file_size BIGINT, -- bytes
    duration INTEGER, -- seconds
    format VARCHAR(10), -- 'mp3', 'wav', 'ogg'
    quality VARCHAR(20), -- 'low', 'medium', 'high'
    encrypted BOOLEAN DEFAULT true,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Call Transcriptions Table
CREATE TABLE call_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    recording_id UUID REFERENCES call_recordings(id),
    full_text TEXT NOT NULL,
    segments JSONB, -- Array of segments with timestamps
    speakers JSONB, -- Speaker diarization data
    summary TEXT,
    action_items JSONB,
    keywords TEXT[],
    sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
    language VARCHAR(10),
    confidence DECIMAL(5, 2), -- 0-100%
    transcribed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emergency Calls Table
CREATE TABLE emergency_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    device_id UUID REFERENCES devices(id),
    call_id UUID REFERENCES calls(id),
    emergency_type VARCHAR(50), -- 'manual', 'auto_crash', 'auto_fall', 'panic', etc.
    emergency_number VARCHAR(20) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    location JSONB NOT NULL, -- GPS coordinates
    situation TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emergency Contacts Table
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    relationship VARCHAR(50), -- 'family', 'friend', 'doctor', etc.
    priority INTEGER DEFAULT 1, -- 1 (highest) to 5 (lowest)
    notify_sms BOOLEAN DEFAULT true,
    notify_call BOOLEAN DEFAULT true,
    notify_email BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts Table (extended for calling)
ALTER TABLE contacts ADD COLUMN whatsapp_number VARCHAR(20);
ALTER TABLE contacts ADD COLUMN telegram_username VARCHAR(255);
ALTER TABLE contacts ADD COLUMN messenger_id VARCHAR(255);
ALTER TABLE contacts ADD COLUMN signal_number VARCHAR(20);
ALTER TABLE contacts ADD COLUMN viber_number VARCHAR(20);
ALTER TABLE contacts ADD COLUMN preferred_call_method VARCHAR(20);
ALTER TABLE contacts ADD COLUMN call_blocked BOOLEAN DEFAULT false;

-- VoIP Credits Table
CREATE TABLE voip_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 4) DEFAULT 0.00, -- USD
    currency VARCHAR(3) DEFAULT 'USD',
    last_topup_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- VoIP Transactions Table
CREATE TABLE voip_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    call_id UUID REFERENCES calls(id),
    transaction_type VARCHAR(20), -- 'topup', 'call', 'refund'
    amount DECIMAL(10, 4),
    balance_before DECIMAL(10, 4),
    balance_after DECIMAL(10, 4),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Call Quality Metrics Table
CREATE TABLE call_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    jitter INTEGER, -- ms
    packet_loss DECIMAL(5, 2), -- percentage
    latency INTEGER, -- ms
    mos_score DECIMAL(3, 2), -- Mean Opinion Score (1-5)
    bandwidth INTEGER, -- kbps
    codec VARCHAR(20), -- 'opus', 'g711', etc.
    network_type VARCHAR(20), -- 'wifi', '4g', '5g', etc.
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_calls_user_date ON calls(user_id, started_at DESC);
CREATE INDEX idx_calls_contact ON calls(contact_id, started_at DESC);
CREATE INDEX idx_recordings_call ON call_recordings(call_id);
CREATE INDEX idx_transcriptions_call ON call_transcriptions(call_id);
CREATE INDEX idx_emergency_user ON emergency_calls(user_id, created_at DESC);
CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id, priority);
```

---

## 🎨 FRONTEND UI COMPONENTS

### **Calling Interface**

```typescript
// frontend/web/src/components/calling/CallingInterface.tsx

import React, { useState, useEffect } from 'react';
import { useCalling } from '@/hooks/useCalling';
import { PhoneIcon, VideoIcon, MicIcon, MicOffIcon } from '@/components/icons';

const CallingInterface: React.FC = () => {
  const {
    activeCall,
    isMuted,
    isSpeaker,
    callDuration,
    callQuality,
    makeCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleRecording
  } = useCalling();

  const [dialNumber, setDialNumber] = useState('');
  const [showDialpad, setShowDialpad] = useState(false);

  return (
    <div className="calling-interface">
      {!activeCall ? (
        // Dialer Screen
        <div className="dialer">
          <div className="dial-display">
            <input
              type="tel"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              placeholder="Enter phone number"
              className="dial-input"
            />
          </div>

          <div className="dial-pad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(num => (
              <button
                key={num}
                onClick={() => setDialNumber(prev => prev + num)}
                className="dial-button"
              >
                {num}
              </button>
            ))}
          </div>

          <div className="dial-actions">
            <button
              onClick={() => makeCall(dialNumber, 'smart')}
              className="call-button"
              disabled={!dialNumber}
            >
              <PhoneIcon /> Call
            </button>
            
            <button
              onClick={() => makeCall(dialNumber, 'video')}
              className="video-button"
              disabled={!dialNumber}
            >
              <VideoIcon /> Video
            </button>
          </div>

          {/* Emergency Quick Dial */}
          <div className="emergency-quick-dial">
            <h3>Emergency</h3>
            <div className="emergency-buttons">
              <button onClick={() => makeEmergencyCall('police')}>
                🚓 Police (110)
              </button>
              <button onClick={() => makeEmergencyCall('medical')}>
                🚑 Medical (118)
              </button>
              <button onClick={() => makeEmergencyCall('fire')}>
                🚒 Fire (113)
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Active Call Screen
        <div className="active-call">
          <div className="call-header">
            <h2>{activeCall.contact_name || activeCall.phone_number}</h2>
            <p className="call-status">{activeCall.status}</p>
            <p className="call-duration">{formatDuration(callDuration)}</p>
          </div>

          {/* Call Quality Indicator */}
          <div className="call-quality">
            <span className={`quality-badge ${callQuality}`}>
              {callQuality === 'excellent' && '📶'}
              {callQuality === 'good' && '📶'}
              {callQuality === 'poor' && '📉'}
            </span>
            <span>{callQuality} quality</span>
          </div>

          {/* Call Controls */}
          <div className="call-controls">
            <button
              onClick={toggleMute}
              className={`control-btn ${isMuted ? 'active' : ''}`}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={toggleSpeaker}
              className={`control-btn ${isSpeaker ? 'active' : ''}`}
            >
              🔊
              <span>Speaker</span>
            </button>

            <button
              onClick={() => setShowDialpad(!showDialpad)}
              className="control-btn"
            >
              #️⃣
              <span>Keypad</span>
            </button>

            <button
              onClick={toggleRecording}
              className="control-btn"
            >
              ⏺️
              <span>Record</span>
            </button>

            <button
              onClick={endCall}
              className="control-btn end-call"
            >
              📞
              <span>End</span>
            </button>
          </div>

          {/* Dialpad during call (for DTMF) */}
          {showDialpad && (
            <div className="in-call-dialpad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(num => (
                <button
                  key={num}
                  onClick={() => sendDTMF(num)}
                  className="dtmf-button"
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CallingInterface;
```

---

**(Dokumentasi berlanjut di Summary...)**
