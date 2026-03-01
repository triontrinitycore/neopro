# 👁️ NEOBOT V7 - VISION SYSTEM (PART 2)
## Multi-Device Integration & Real-Time Streaming

---

## 📱 2. MULTI-DEVICE CAMERA INTEGRATION

### **A. Universal Device Camera Access**

```kotlin
// Multi-Device Camera Integration System

class MultiDeviceCameraSystem {
    
    private val deviceManager = DeviceManager()
    private val cameraManager = CameraManager()
    private val streamManager = StreamManager()
    
    // Initialize multi-device system
    suspend fun initialize() {
        
        log("📱 Initializing Multi-Device Camera System...")
        
        // Discover all available devices
        val devices = deviceManager.discoverDevices()
        
        log("✅ Found ${devices.size} devices:")
        for (device in devices) {
            log("  📱 ${device.type}: ${device.name} (${device.cameras.size} cameras)")
        }
        
        log("✅ Multi-Device System Active")
    }
    
    // Get camera from specific device
    suspend fun getCameraFromDevice(
        deviceType: DeviceType,
        cameraIndex: Int = 0
    ): Camera? {
        
        val device = deviceManager.getDevice(deviceType)
        
        if (device == null) {
            log("❌ Device not found: $deviceType")
            return null
        }
        
        if (cameraIndex >= device.cameras.size) {
            log("❌ Camera index out of range: $cameraIndex")
            return null
        }
        
        val camera = device.cameras[cameraIndex]
        
        log("✅ Camera acquired: ${device.name} - ${camera.name}")
        
        return camera
    }
    
    // Start live stream from device
    suspend fun startLiveStream(
        deviceType: DeviceType,
        cameraIndex: Int = 0,
        options: StreamOptions = StreamOptions(),
        onFrame: (Frame) -> Unit
    ): StreamSession {
        
        log("🎥 Starting live stream from: $deviceType")
        
        // Get camera
        val camera = getCameraFromDevice(deviceType, cameraIndex)
            ?: throw Exception("Camera not available")
        
        // Configure camera
        camera.configure(
            resolution = options.resolution,
            fps = options.fps,
            format = options.format
        )
        
        // Start capture
        val session = camera.startCapture { frame ->
            // Process frame
            onFrame(frame)
        }
        
        log("✅ Live stream started (${options.resolution} @ ${options.fps}fps)")
        
        return session
    }
    
    // Capture single photo from device
    suspend fun capturePhoto(
        deviceType: DeviceType,
        cameraIndex: Int = 0,
        options: CaptureOptions = CaptureOptions()
    ): CaptureResult {
        
        log("📸 Capturing photo from: $deviceType")
        
        val camera = getCameraFromDevice(deviceType, cameraIndex)
            ?: return CaptureResult(
                success = false,
                error = "Camera not available"
            )
        
        // Capture photo
        val photo = camera.capturePhoto(options)
        
        log("✅ Photo captured (${photo.width}x${photo.height})")
        
        return CaptureResult(
            success = true,
            image = photo,
            metadata = CaptureMetadata(
                device = deviceType,
                camera = camera.name,
                resolution = "${photo.width}x${photo.height}",
                timestamp = System.currentTimeMillis()
            )
        )
    }
}

// Device Manager - Discover and manage devices
class DeviceManager {
    
    private val devices = mutableListOf<Device>()
    
    // Discover all available devices
    suspend fun discoverDevices(): List<Device> {
        
        log("🔍 Discovering devices...")
        
        devices.clear()
        
        // 1. Smartphone (Android/iOS)
        discoverSmartphones()
        
        // 2. Smartwatch (WearOS/WatchOS)
        discoverSmartwatches()
        
        // 3. Smart Glasses (AR Glasses)
        discoverSmartGlasses()
        
        // 4. Laptop Webcam
        discoverLaptopWebcams()
        
        // 5. Desktop Webcam
        discoverDesktopWebcams()
        
        // 6. External Cameras (USB, IP)
        discoverExternalCameras()
        
        log("✅ Discovery complete: ${devices.size} devices")
        
        return devices
    }
    
    // 1. Discover Smartphones
    private suspend fun discoverSmartphones() {
        
        // Android
        if (isAndroid()) {
            val androidDevice = Device(
                type = DeviceType.SMARTPHONE,
                platform = Platform.ANDROID,
                name = android.os.Build.MODEL,
                cameras = discoverAndroidCameras()
            )
            devices.add(androidDevice)
            log("  ✅ Android: ${androidDevice.name}")
        }
        
        // iOS
        if (isIOS()) {
            val iosDevice = Device(
                type = DeviceType.SMARTPHONE,
                platform = Platform.IOS,
                name = UIDevice.current.name,
                cameras = discoverIOSCameras()
            )
            devices.add(iosDevice)
            log("  ✅ iOS: ${iosDevice.name}")
        }
    }
    
    // Discover Android cameras
    private fun discoverAndroidCameras(): List<Camera> {
        
        val cameras = mutableListOf<Camera>()
        
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        
        for (cameraId in cameraManager.cameraIdList) {
            val characteristics = cameraManager.getCameraCharacteristics(cameraId)
            
            val facing = characteristics.get(CameraCharacteristics.LENS_FACING)
            val name = when (facing) {
                CameraCharacteristics.LENS_FACING_FRONT -> "Front Camera"
                CameraCharacteristics.LENS_FACING_BACK -> "Back Camera"
                else -> "Camera $cameraId"
            }
            
            cameras.add(
                Camera(
                    id = cameraId,
                    name = name,
                    facing = facing ?: 0,
                    type = CameraType.BUILT_IN,
                    platform = Platform.ANDROID
                )
            )
        }
        
        return cameras
    }
    
    // Discover iOS cameras
    private fun discoverIOSCameras(): List<Camera> {
        
        val cameras = mutableListOf<Camera>()
        
        // Front camera
        cameras.add(
            Camera(
                id = "front",
                name = "Front Camera",
                facing = AVCaptureDevice.Position.front,
                type = CameraType.BUILT_IN,
                platform = Platform.IOS
            )
        )
        
        // Back camera(s)
        val backDevices = AVCaptureDevice.devices(
            for: AVMediaType.video,
            with: AVCaptureDevice.Position.back
        )
        
        for ((index, device) in backDevices.withIndex()) {
            cameras.add(
                Camera(
                    id = "back_$index",
                    name = device.localizedName,
                    facing = AVCaptureDevice.Position.back,
                    type = CameraType.BUILT_IN,
                    platform = Platform.IOS
                )
            )
        }
        
        return cameras
    }
    
    // 2. Discover Smartwatches
    private suspend fun discoverSmartwatches() {
        
        // WearOS (Android Watch)
        if (isWearOS()) {
            val wearDevice = Device(
                type = DeviceType.SMARTWATCH,
                platform = Platform.WEAROS,
                name = "WearOS Watch",
                cameras = discoverWearOSCameras()
            )
            devices.add(wearDevice)
            log("  ✅ WearOS: ${wearDevice.name}")
        }
        
        // WatchOS (Apple Watch)
        if (isWatchOS()) {
            val watchDevice = Device(
                type = DeviceType.SMARTWATCH,
                platform = Platform.WATCHOS,
                name = "Apple Watch",
                cameras = discoverWatchOSCameras()
            )
            devices.add(watchDevice)
            log("  ✅ WatchOS: ${watchDevice.name}")
        }
    }
    
    // 3. Discover Smart Glasses
    private suspend fun discoverSmartGlasses() {
        
        // Check for AR glasses (Google Glass, RayBan Stories, etc.)
        val glassesDevices = findARGlasses()
        
        for (glasses in glassesDevices) {
            devices.add(glasses)
            log("  ✅ Smart Glasses: ${glasses.name}")
        }
    }
    
    // 4. Discover Laptop Webcams
    private suspend fun discoverLaptopWebcams() {
        
        if (isLaptop()) {
            val webcams = findWebcams()
            
            if (webcams.isNotEmpty()) {
                val laptop = Device(
                    type = DeviceType.LAPTOP,
                    platform = getCurrentPlatform(),
                    name = getDeviceName(),
                    cameras = webcams
                )
                devices.add(laptop)
                log("  ✅ Laptop: ${laptop.name} (${webcams.size} cameras)")
            }
        }
    }
    
    // 5. Discover Desktop Webcams
    private suspend fun discoverDesktopWebcams() {
        
        if (isDesktop()) {
            val webcams = findWebcams()
            
            if (webcams.isNotEmpty()) {
                val desktop = Device(
                    type = DeviceType.DESKTOP,
                    platform = getCurrentPlatform(),
                    name = getDeviceName(),
                    cameras = webcams
                )
                devices.add(desktop)
                log("  ✅ Desktop: ${desktop.name} (${webcams.size} cameras)")
            }
        }
    }
    
    // Find webcams on Windows/Mac/Linux
    private fun findWebcams(): List<Camera> {
        
        val cameras = mutableListOf<Camera>()
        
        when (getCurrentPlatform()) {
            Platform.WINDOWS -> {
                // Use DirectShow to enumerate cameras
                val webcams = enumerateWindowsWebcams()
                cameras.addAll(webcams)
            }
            Platform.MACOS -> {
                // Use AVFoundation
                val webcams = enumerateMacWebcams()
                cameras.addAll(webcams)
            }
            Platform.LINUX -> {
                // Use V4L2 (Video4Linux2)
                val webcams = enumerateLinuxWebcams()
                cameras.addAll(webcams)
            }
        }
        
        return cameras
    }
    
    // Enumerate Windows webcams (DirectShow)
    private fun enumerateWindowsWebcams(): List<Camera> {
        
        val cameras = mutableListOf<Camera>()
        
        try {
            // Use OpenCV VideoCapture to detect cameras
            var index = 0
            while (index < 10) { // Check first 10 indices
                val cap = VideoCapture(index)
                
                if (cap.isOpened()) {
                    cameras.add(
                        Camera(
                            id = index.toString(),
                            name = "Webcam $index",
                            facing = 0,
                            type = CameraType.USB,
                            platform = Platform.WINDOWS
                        )
                    )
                    cap.release()
                }
                
                index++
            }
        } catch (e: Exception) {
            log("⚠️ Error enumerating Windows webcams: ${e.message}")
        }
        
        return cameras
    }
    
    // 6. Discover External Cameras
    private suspend fun discoverExternalCameras() {
        
        // USB Cameras
        val usbCameras = findUSBCameras()
        for (camera in usbCameras) {
            val device = Device(
                type = DeviceType.EXTERNAL_CAMERA,
                platform = getCurrentPlatform(),
                name = "USB Camera",
                cameras = listOf(camera)
            )
            devices.add(device)
        }
        
        // IP Cameras (network discovery)
        val ipCameras = findIPCameras()
        for (camera in ipCameras) {
            val device = Device(
                type = DeviceType.EXTERNAL_CAMERA,
                platform = Platform.NETWORK,
                name = "IP Camera",
                cameras = listOf(camera)
            )
            devices.add(device)
        }
    }
    
    // Get specific device
    fun getDevice(type: DeviceType): Device? {
        return devices.find { it.type == type }
    }
}

// Camera class - Universal camera interface
class Camera(
    val id: String,
    val name: String,
    val facing: Int,
    val type: CameraType,
    val platform: Platform
) {
    
    private var captureSession: CaptureSession? = null
    
    // Configure camera
    fun configure(
        resolution: String,
        fps: Int,
        format: String
    ) {
        log("⚙️ Configuring camera: $resolution @ ${fps}fps, format: $format")
        
        // Platform-specific configuration
        when (platform) {
            Platform.ANDROID -> configureAndroidCamera(resolution, fps, format)
            Platform.IOS -> configureIOSCamera(resolution, fps, format)
            Platform.WINDOWS, Platform.MACOS, Platform.LINUX -> 
                configureDesktopCamera(resolution, fps, format)
            else -> log("⚠️ Platform not supported for configuration")
        }
    }
    
    // Configure Android camera
    private fun configureAndroidCamera(resolution: String, fps: Int, format: String) {
        
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val characteristics = cameraManager.getCameraCharacteristics(id)
        
        // Get available stream configurations
        val configMap = characteristics.get(
            CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP
        )
        
        // Find closest resolution
        val targetSize = parseResolution(resolution)
        val outputSizes = configMap?.getOutputSizes(SurfaceTexture::class.java)
        
        val closestSize = outputSizes?.minByOrNull { size ->
            abs(size.width - targetSize.width) + abs(size.height - targetSize.height)
        }
        
        log("✅ Android camera configured: ${closestSize?.width}x${closestSize?.height}")
    }
    
    // Start capture
    fun startCapture(onFrame: (Frame) -> Unit): StreamSession {
        
        val session = StreamSession(
            camera = this,
            startTime = System.currentTimeMillis()
        )
        
        // Platform-specific capture
        when (platform) {
            Platform.ANDROID -> startAndroidCapture(onFrame)
            Platform.IOS -> startIOSCapture(onFrame)
            Platform.WINDOWS, Platform.MACOS, Platform.LINUX -> 
                startDesktopCapture(onFrame)
            else -> log("⚠️ Platform not supported for capture")
        }
        
        captureSession = session
        
        return session
    }
    
    // Start Android capture
    private fun startAndroidCapture(onFrame: (Frame) -> Unit) {
        
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        
        val imageReader = ImageReader.newInstance(
            1920, 1080,
            ImageFormat.YUV_420_888,
            2
        )
        
        imageReader.setOnImageAvailableListener({ reader ->
            val image = reader.acquireLatestImage()
            
            if (image != null) {
                // Convert to Bitmap
                val bitmap = imageTobitmap(image)
                
                // Create frame
                val frame = Frame(
                    image = bitmap,
                    timestamp = System.currentTimeMillis(),
                    width = bitmap.width,
                    height = bitmap.height
                )
                
                onFrame(frame)
                
                image.close()
            }
        }, null)
        
        // Open camera and create capture session
        cameraManager.openCamera(id, object : CameraDevice.StateCallback() {
            override fun onOpened(camera: CameraDevice) {
                camera.createCaptureSession(
                    listOf(imageReader.surface),
                    object : CameraCaptureSession.StateCallback() {
                        override fun onConfigured(session: CameraCaptureSession) {
                            // Start repeating capture
                            val captureRequest = camera.createCaptureRequest(
                                CameraDevice.TEMPLATE_PREVIEW
                            ).apply {
                                addTarget(imageReader.surface)
                            }.build()
                            
                            session.setRepeatingRequest(captureRequest, null, null)
                        }
                        
                        override fun onConfigureFailed(session: CameraCaptureSession) {
                            log("❌ Camera session configuration failed")
                        }
                    },
                    null
                )
            }
            
            override fun onDisconnected(camera: CameraDevice) {
                camera.close()
            }
            
            override fun onError(camera: CameraDevice, error: Int) {
                log("❌ Camera error: $error")
                camera.close()
            }
        }, null)
    }
    
    // Start desktop capture (OpenCV)
    private fun startDesktopCapture(onFrame: (Frame) -> Unit) {
        
        val videoCapture = VideoCapture(id.toInt())
        
        if (!videoCapture.isOpened()) {
            log("❌ Failed to open camera")
            return
        }
        
        // Capture loop
        GlobalScope.launch {
            val mat = Mat()
            
            while (videoCapture.read(mat)) {
                // Convert Mat to Bitmap
                val bitmap = matToBitmap(mat)
                
                // Create frame
                val frame = Frame(
                    image = bitmap,
                    timestamp = System.currentTimeMillis(),
                    width = bitmap.width,
                    height = bitmap.height
                )
                
                onFrame(frame)
                
                // Control frame rate
                delay(33) // ~30 FPS
            }
            
            videoCapture.release()
        }
    }
    
    // Capture single photo
    fun capturePhoto(options: CaptureOptions): Bitmap {
        
        // Platform-specific photo capture
        return when (platform) {
            Platform.ANDROID -> captureAndroidPhoto(options)
            Platform.IOS -> captureIOSPhoto(options)
            Platform.WINDOWS, Platform.MACOS, Platform.LINUX -> 
                captureDesktopPhoto(options)
            else -> {
                log("⚠️ Platform not supported for photo capture")
                Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
            }
        }
    }
    
    // Stop capture
    fun stopCapture() {
        captureSession = null
        log("⏹️ Capture stopped")
    }
}

// Data models
enum class DeviceType {
    SMARTPHONE,
    SMARTWATCH,
    SMART_GLASSES,
    LAPTOP,
    DESKTOP,
    EXTERNAL_CAMERA
}

enum class Platform {
    ANDROID,
    IOS,
    WEAROS,
    WATCHOS,
    WINDOWS,
    MACOS,
    LINUX,
    NETWORK
}

enum class CameraType {
    BUILT_IN,
    USB,
    IP,
    AR_GLASSES
}

data class Device(
    val type: DeviceType,
    val platform: Platform,
    val name: String,
    val cameras: List<Camera>
)

data class StreamOptions(
    val resolution: String = "1920x1080",
    val fps: Int = 30,
    val format: String = "YUV420"
)

data class CaptureOptions(
    val quality: Int = 95,
    val format: String = "JPEG"
)

data class Frame(
    val image: Bitmap,
    val timestamp: Long,
    val width: Int,
    val height: Int
)

data class StreamSession(
    val camera: Camera,
    val startTime: Long
)

data class CaptureResult(
    val success: Boolean,
    val image: Bitmap? = null,
    val metadata: CaptureMetadata? = null,
    val error: String? = null
)

data class CaptureMetadata(
    val device: DeviceType,
    val camera: String,
    val resolution: String,
    val timestamp: Long
)
```

---

## 🎯 3. SCREEN CAPTURE & SHARING

### **A. Desktop/Mobile Screen Recording**

```kotlin
// Screen Capture System

class ScreenCaptureSystem {
    
    // Capture desktop screen
    suspend fun captureDesktopScreen(): Bitmap {
        
        log("🖥️ Capturing desktop screen...")
        
        return when (getCurrentPlatform()) {
            Platform.WINDOWS -> captureWindowsScreen()
            Platform.MACOS -> captureMacScreen()
            Platform.LINUX -> captureLinuxScreen()
            else -> throw Exception("Platform not supported")
        }
    }
    
    // Capture Windows screen
    private fun captureWindowsScreen(): Bitmap {
        
        val screenSize = Toolkit.getDefaultToolkit().screenSize
        val robot = Robot()
        
        val capture = robot.createScreenCapture(
            Rectangle(screenSize)
        )
        
        return capture.toBitmap()
    }
    
    // Capture mobile screen (Android)
    suspend fun captureMobileScreen(): Bitmap {
        
        if (!isAndroid()) {
            throw Exception("Not an Android device")
        }
        
        log("📱 Capturing mobile screen...")
        
        // Request screen capture permission
        val mediaProjection = requestMediaProjection()
        
        // Create virtual display
        val imageReader = ImageReader.newInstance(
            Resources.getSystem().displayMetrics.widthPixels,
            Resources.getSystem().displayMetrics.heightPixels,
            PixelFormat.RGBA_8888,
            2
        )
        
        mediaProjection.createVirtualDisplay(
            "ScreenCapture",
            imageReader.width,
            imageReader.height,
            Resources.getSystem().displayMetrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader.surface,
            null,
            null
        )
        
        // Capture image
        val image = imageReader.acquireLatestImage()
        val bitmap = imageToVitmap(image)
        
        image.close()
        imageReader.close()
        
        return bitmap
    }
    
    // Start screen recording
    suspend fun startScreenRecording(
        onFrame: (Bitmap) -> Unit
    ): RecordingSession {
        
        log("🎬 Starting screen recording...")
        
        val session = RecordingSession(
            startTime = System.currentTimeMillis()
        )
        
        // Capture frames at 30 FPS
        GlobalScope.launch {
            while (session.isActive) {
                val screenshot = when {
                    isAndroid() -> captureMobileScreen()
                    else -> captureDesktopScreen()
                }
                
                onFrame(screenshot)
                
                delay(33) // 30 FPS
            }
        }
        
        return session
    }
}

data class RecordingSession(
    val startTime: Long,
    var isActive: Boolean = true
)
```

---

**(Dokumentasi berlanjut di Part 3 dengan Developer Assistant, Project Management, dan Multi-Language Support...)**
