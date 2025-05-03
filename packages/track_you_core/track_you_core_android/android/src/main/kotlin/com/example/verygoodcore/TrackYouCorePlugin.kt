package com.example.verygoodcore

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import io.flutter.plugin.common.PluginRegistry

class TrackYouCorePlugin : FlutterPlugin, MethodCallHandler, EventChannel.StreamHandler, ActivityAware, PluginRegistry.RequestPermissionsResultListener {
    private lateinit var methodChannel: MethodChannel
    private lateinit var eventChannel: EventChannel
    private var locationManager: LocationManager? = null
    private var eventSink: EventChannel.EventSink? = null
    private var activity: Activity? = null
    private var context: Context? = null
    private val LOCATION_PERMISSION_REQUEST_CODE = 1234
    private var pendingResult: Result? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isServiceRunning = false
    private var locationReceiver: android.content.BroadcastReceiver? = null

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            mainHandler.post {
                sendLocationUpdateToEventSink(location)
            }
        }

        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    private fun sendLocationUpdateToEventSink(location: Location) {
        eventSink?.success(mapOf(
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "altitude" to location.altitude,
            "accuracy" to location.accuracy,
            "bearing" to location.bearing,
            "speed" to location.speed,
            "timestamp" to location.time
        ))
    }

    override fun onAttachedToEngine(@NonNull flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel = MethodChannel(flutterPluginBinding.binaryMessenger, "track_you_core_android")
        methodChannel.setMethodCallHandler(this)
        
        eventChannel = EventChannel(flutterPluginBinding.binaryMessenger, "track_you_core/location_updates")
        eventChannel.setStreamHandler(this)
        
        context = flutterPluginBinding.applicationContext
        locationManager = context?.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        
        // Register the broadcast receiver for location updates from the service
        locationReceiver = object : android.content.BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                intent?.let { intent ->
                    mainHandler.post {
                        val location = Location("").apply {
                            latitude = intent.getDoubleExtra("latitude", 0.0)
                            longitude = intent.getDoubleExtra("longitude", 0.0)
                            altitude = intent.getDoubleExtra("altitude", 0.0)
                            accuracy = intent.getFloatExtra("accuracy", 0f)
                            bearing = intent.getFloatExtra("bearing", 0f)
                            speed = intent.getFloatExtra("speed", 0f)
                            time = intent.getLongExtra("timestamp", 0L)
                        }
                        sendLocationUpdateToEventSink(location)
                    }
                }
            }
        }
        
        context?.registerReceiver(
            locationReceiver,
            IntentFilter("com.example.verygoodcore.LOCATION_UPDATE")
        )
    }

    override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
        when (call.method) {
            "getPlatformName" -> result.success("Android ${Build.VERSION.RELEASE}")
            "getPlatformVersion" -> result.success("Android ${Build.VERSION.SDK_INT}")
            "startLocationService" -> {
                pendingResult = result
                startLocationUpdates()
            }
            "stopLocationService" -> {
                stopLocationUpdates()
                result.success(true)
            }
            else -> result.notImplemented()
        }
    }

    private fun startLocationUpdates() {
        if (hasLocationPermission()) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context?.let { context ->
                        val intent = Intent(context, LocationService::class.java)
                        context.startForegroundService(intent)
                        isServiceRunning = true
                        pendingResult?.success(true)
                        pendingResult = null
                    }
                } else {
                    // For pre-Oreo devices, use the standard location manager
                    locationManager?.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        1000, // min time between updates
                        1f,    // min distance
                        locationListener
                    )
                    pendingResult?.success(true)
                    pendingResult = null
                }
            } catch (e: SecurityException) {
                pendingResult?.error("PERMISSION_DENIED", "Location permission denied", null)
                pendingResult = null
            }
        } else {
            requestLocationPermission()
        }
    }

    private fun stopLocationUpdates() {
        try {
            if (isServiceRunning) {
                context?.stopService(Intent(context, LocationService::class.java))
                isServiceRunning = false
            } else {
                locationManager?.removeUpdates(locationListener)
            }
        } catch (e: Exception) {
            // Handle exception silently
        }
    }

    private fun hasLocationPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true
        
        return activity?.let {
            val hasFineLocation = ContextCompat.checkSelfPermission(
                it, Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
            
            // For Android 10+ check background permission too
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                hasFineLocation && ContextCompat.checkSelfPermission(
                    it, Manifest.permission.ACCESS_BACKGROUND_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
            } else {
                hasFineLocation
            }
        } ?: false
    }

    private fun requestLocationPermission() {
        activity?.let {
            val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_BACKGROUND_LOCATION
                )
            } else {
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
            }
            
            ActivityCompat.requestPermissions(
                it, permissions, LOCATION_PERMISSION_REQUEST_CODE
            )
        } ?: run {
            pendingResult?.error("ACTIVITY_NULL", "Activity is null, cannot request permissions", null)
            pendingResult = null
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray): Boolean {
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startLocationUpdates()
                return true
            } else {
                pendingResult?.error("PERMISSION_DENIED", "Location permission denied", null)
                pendingResult = null
            }
        }
        return false
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        eventSink = null
    }

    override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel.setMethodCallHandler(null)
        eventChannel.setStreamHandler(null)
        stopLocationUpdates()
        
        // Unregister broadcast receiver
        locationReceiver?.let { context?.unregisterReceiver(it) }
        locationReceiver = null
    }

    override fun onAttachedToActivity(binding: ActivityPluginBinding) {
        activity = binding.activity
        binding.addRequestPermissionsResultListener(this)
    }

    override fun onDetachedFromActivityForConfigChanges() {
        activity = null
    }

    override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
        activity = binding.activity
        binding.addRequestPermissionsResultListener(this)
    }

    override fun onDetachedFromActivity() {
        activity = null
    }
    
    // Foreground service for background location tracking
    class LocationService : Service() {
        private val binder = LocalBinder()
        private var locationManager: LocationManager? = null
        private var locationListener: LocationListener? = null
        private val NOTIFICATION_ID = 12345
        private val CHANNEL_ID = "track_you_location_channel"
        
        inner class LocalBinder : Binder() {
            fun getService(): LocationService = this@LocationService
        }
        
        override fun onBind(intent: Intent?): IBinder {
            return binder
        }
        
        override fun onCreate() {
            super.onCreate()
            locationManager = getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            
            locationListener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    // Broadcast the location to all listeners
                    val intent = Intent("com.example.verygoodcore.LOCATION_UPDATE").apply {
                        putExtra("latitude", location.latitude)
                        putExtra("longitude", location.longitude)
                        putExtra("altitude", location.altitude)
                        putExtra("accuracy", location.accuracy)
                        putExtra("bearing", location.bearing)
                        putExtra("speed", location.speed)
                        putExtra("timestamp", location.time)
                    }
                    sendBroadcast(intent)
                }
                
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }
            
            createNotificationAndStartForeground()
        }
        
        override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
            startLocationUpdates()
            return START_STICKY
        }
        
        private fun createNotificationAndStartForeground() {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Create the notification channel for Android O and above
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Location Tracking",
                    NotificationManager.IMPORTANCE_LOW // Lower importance to prevent sound/vibration
                ).apply {
                    lightColor = Color.BLUE
                    lockscreenVisibility = Notification.VISIBILITY_PRIVATE
                }
                notificationManager.createNotificationChannel(channel)
            }
            
            // Create the notification intent
            val notificationIntent = packageManager.getLaunchIntentForPackage(packageName)
            val pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) 
                    PendingIntent.FLAG_IMMUTABLE else 0
            )
            
            // Build the notification
            val notification = NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Location Tracking")
                .setContentText("Tracking your location in the background")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build()
            
            startForeground(NOTIFICATION_ID, notification)
        }
        
        private fun startLocationUpdates() {
            try {
                locationManager?.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    1000, // min time between updates
                    1f,    // min distance
                    locationListener ?: return
                )
            } catch (e: SecurityException) {
                // Handle permission issues silently
            }
        }
        
        override fun onDestroy() {
            locationListener?.let { listener ->
                locationManager?.removeUpdates(listener)
            }
            super.onDestroy()
        }
    }
}