import Flutter
import UIKit
import CoreLocation

public class TrackYouCorePlugin: NSObject, FlutterPlugin, FlutterStreamHandler, CLLocationManagerDelegate {
  private var locationManager: CLLocationManager?
  private var eventSink: FlutterEventSink?
  private var pendingResult: FlutterResult?
  private var backgroundTask: UIBackgroundTaskIdentifier = .invalid
  private var lastSentTime: Date?
  private var isTracking = false
  private var locationServicesEnabled: Bool {
    return CLLocationManager.locationServicesEnabled()
  }
  
  public static func register(with registrar: FlutterPluginRegistrar) {
    let methodChannel = FlutterMethodChannel(name: "track_you_core_ios", binaryMessenger: registrar.messenger())
    let eventChannel = FlutterEventChannel(name: "track_you_core/location_updates", binaryMessenger: registrar.messenger())
    
    let instance = TrackYouCorePlugin()
    registrar.addMethodCallDelegate(instance, channel: methodChannel)
    eventChannel.setStreamHandler(instance)
    
    // Keep plugin in memory even if detached
    registrar.addApplicationDelegate(instance)
  }

  public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "startLocationService":
      pendingResult = result
      startLocationUpdates()
    case "stopLocationService":
      stopLocationUpdates()
      result(true)
    default:
      result(FlutterMethodNotImplemented)
    }
  }
  
  // MARK: - FlutterStreamHandler
  
  public func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
    eventSink = events
    return nil
  }
  
  public func onCancel(withArguments arguments: Any?) -> FlutterError? {
    eventSink = nil
    return nil
  }
  
  // MARK: - Location Manager
  
  private func startLocationUpdates() {
    if !locationServicesEnabled {
      pendingResult?(FlutterError(code: "LOCATION_SERVICES_DISABLED", 
                                 message: "Location services are disabled on this device", 
                                 details: nil))
      return
    }
    
    // Initialize location manager if it doesn't exist
    if locationManager == nil {
      locationManager = CLLocationManager()
      locationManager?.delegate = self
      locationManager?.desiredAccuracy = kCLLocationAccuracyBest
      locationManager?.distanceFilter = 1 // Update when device moves 1 meter
      locationManager?.allowsBackgroundLocationUpdates = true
      locationManager?.pausesLocationUpdatesAutomatically = false
      
      // Required for reliable background updates
      if #available(iOS 11.0, *) {
        locationManager?.showsBackgroundLocationIndicator = true
      }
      
      // Enable significant location changes to restart app if terminated
      locationManager?.startMonitoringSignificantLocationChanges()
    }
    
    // Begin a background task
    beginBackgroundTask()
    
    // Get the current authorization status
    let authorizationStatus: CLAuthorizationStatus
    if #available(iOS 14.0, *) {
      authorizationStatus = locationManager?.authorizationStatus ?? .notDetermined
    } else {
      authorizationStatus = CLLocationManager.authorizationStatus()
    }
    
    // Check and handle authorization status
    switch authorizationStatus {
    case .notDetermined:
      // Request both types of permissions to ensure full functionality
      locationManager?.requestWhenInUseAuthorization()
      // After user grants when-in-use, we'll request always in didChangeAuthorization
    case .authorizedWhenInUse:
      // User has already granted when-in-use, now request always
      locationManager?.requestAlwaysAuthorization()
      locationManager?.startUpdatingLocation()
      isTracking = true
      pendingResult?(true)
      pendingResult = nil
    case .authorizedAlways:
      // Start updating location with max permissions
      locationManager?.startUpdatingLocation()
      isTracking = true
      pendingResult?(true)
      pendingResult = nil
    default:
      pendingResult?(FlutterError(code: "PERMISSION_DENIED", 
                                 message: "Location permission denied", 
                                 details: nil))
      pendingResult = nil
    }
  }
  
  private func stopLocationUpdates() {
    locationManager?.stopUpdatingLocation()
    locationManager?.stopMonitoringSignificantLocationChanges()
    isTracking = false
    endBackgroundTask()
  }
  
  private func beginBackgroundTask() {
    // End previous task if it exists
    endBackgroundTask()
    
    // Start a new background task
    backgroundTask = UIApplication.shared.beginBackgroundTask { [weak self] in
      self?.endBackgroundTask()
    }
  }
  
  private func endBackgroundTask() {
    if backgroundTask != .invalid {
      UIApplication.shared.endBackgroundTask(backgroundTask)
      backgroundTask = .invalid
    }
  }
  
  // MARK: - CLLocationManagerDelegate
  
  public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last, let eventSink = eventSink else { return }
    
    // Check if we should throttle updates - only send every 1 second to prevent overloading
    let currentTime = Date()
    if let lastTime = lastSentTime, currentTime.timeIntervalSince(lastTime) < 1.0 {
      return
    }
    
    // Update time of last sent location
    lastSentTime = currentTime
    
    // Extend background execution time
    beginBackgroundTask()
    
    // Prepare location data to send to Flutter
    let locationData: [String: Any] = [
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude,
      "altitude": location.altitude,
      "accuracy": location.horizontalAccuracy,
      "speed": location.speed,
      "bearing": location.course,
      "timestamp": Int(location.timestamp.timeIntervalSince1970 * 1000)
    ]
    
    // Send to Flutter
    eventSink(locationData)
  }
  
  public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("Location error: \(error.localizedDescription)")
    eventSink?(FlutterError(code: "LOCATION_ERROR", 
                           message: error.localizedDescription, 
                           details: nil))
  }
  
  public func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    switch status {
    case .authorizedWhenInUse:
      // Now that we have when-in-use, request the more permissive always permission
      locationManager?.requestAlwaysAuthorization()
      if pendingResult != nil {
        locationManager?.startUpdatingLocation()
        isTracking = true
        pendingResult?(true)
      }
    case .authorizedAlways:
      if pendingResult != nil {
        locationManager?.startUpdatingLocation()
        isTracking = true
        pendingResult?(true)
      }
    case .denied, .restricted:
      pendingResult?(FlutterError(code: "PERMISSION_DENIED", 
                                 message: "Location permission denied", 
                                 details: nil))
      isTracking = false
    default:
      break
    }
    
    pendingResult = nil
  }
  
  // MARK: - App Lifecycle Methods
  
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [AnyHashable : Any] = [:]) -> Bool {
    // Check if app was launched from location update
    if let _ = launchOptions[UIApplication.LaunchOptionsKey.location] {
      // App was launched due to a location event
      if isTracking {
        startLocationUpdates()
      }
    }
    return true
  }
  
  public func applicationDidEnterBackground(_ application: UIApplication) {
    if isTracking {
      // Ensure background task is running
      beginBackgroundTask()
    }
  }
  
  public func applicationWillEnterForeground(_ application: UIApplication) {
    if isTracking {
      // Restart updates in case they were stopped
      locationManager?.startUpdatingLocation()
    }
  }
  
  public func applicationWillTerminate(_ application: UIApplication) {
    // Start significant location changes before app is terminated
    if isTracking {
      locationManager?.startMonitoringSignificantLocationChanges()
    }
  }
}
