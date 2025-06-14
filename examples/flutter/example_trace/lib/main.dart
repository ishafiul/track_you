import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:track_you_core/track_you_core.dart';
import 'package:http/http.dart' as http;

// API base URL
const String apiBaseUrl = 'https://portfolio-server.shafiulislam20.workers.dev';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Track You Example',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _isServiceRunning = false;
  StreamSubscription<Map<String, dynamic>>? _locationSubscription;
  Map<String, dynamic>? _lastLocation;
  String? _platformName;
  String? _platformVersion;
  String? _errorMessage;
  List<String> _logMessages = [];

  // Flag to track if we're currently sending a location update to the server
  bool _isSendingLocation = false;

  @override
  void initState() {
    super.initState();
    _loadPlatformInfo();
  }

  @override
  void dispose() {
    _locationSubscription?.cancel();
    super.dispose();
  }

  void _addLog(String message) {
    setState(() {
      _logMessages.add('[${DateTime.now().toString()}] $message');
      // Keep only the last 20 messages
      if (_logMessages.length > 20) {
        _logMessages.removeAt(0);
      }
    });
  }

  Future<void> _loadPlatformInfo() async {
    try {
      _addLog('Loading platform info...');
    } catch (e) {
      _addLog('Error loading platform info: $e');
      setState(() {
        _errorMessage = 'Error loading platform info: $e';
      });
    }
  }

  Future<void> _startLocationService() async {
    try {
      setState(() {
        _errorMessage = null;
      });

      _addLog('Starting location service...');
      final result = await startLocationService();
      _addLog('Location service start result: $result');

      if (result) {
        _addLog('Starting to listen for location updates');
        _locationSubscription = getLocationUpdates().listen(
          (locationData) {
            _addLog(
                'Location update received: ${locationData['latitude']}, ${locationData['longitude']}');
            setState(() {
              _lastLocation = locationData;
              _isServiceRunning = true;
            });

            // Send the location data to the server
            _sendLocationToServer(locationData);
          },
          onError: (error) {
            _addLog('Location stream error: $error');
            setState(() {
              _errorMessage = 'Location error: $error';
              _isServiceRunning = false;
            });
          },
        );
      } else {
        _addLog('Failed to start location service');
        setState(() {
          _errorMessage = 'Failed to start location service';
        });
      }
    } catch (error) {
      _addLog('Error starting location service: $error');
      setState(() {
        _errorMessage = 'Error: $error';
      });
    }
  }

  Future<void> _stopLocationService() async {
    try {
      _addLog('Stopping location service...');
      await stopLocationService();
      _locationSubscription?.cancel();
      _locationSubscription = null;
      _addLog('Location service stopped');

      setState(() {
        _isServiceRunning = false;
      });
    } catch (error) {
      _addLog('Error stopping location service: $error');
      setState(() {
        _errorMessage = 'Error stopping service: $error';
      });
    }
  }

  void _clearLogs() {
    setState(() {
      _logMessages.clear();
    });
  }

  // Function to send location data to the server
  Future<void> _sendLocationToServer(Map<String, dynamic> locationData) async {
    if (_isSendingLocation) return; // Prevent multiple simultaneous calls

    try {
      _isSendingLocation = true;
      _addLog('Sending location data to server...');

      // Format the location data according to the API requirements
      // Convert all numeric values to strings as required by the API
      final payload = {
        'latitude': locationData['latitude'].toString(),
        'longitude': locationData['longitude'].toString(),
        'altitude': locationData['altitude'].toString(),
        'accuracy': locationData['accuracy'].toString(),
        'speed': locationData['speed'].toString(),
        'bearing': locationData['bearing'].toString(),
        'timestamp': locationData['timestamp'].toString(),
        'subscriptionId': 'default_subscription', // Required field
      };

      // Make the API call
      final response = await http.post(
        Uri.parse('$apiBaseUrl/location/insert'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode == 201) {
        // Successfully sent location data
        _addLog('Location data sent to server successfully');
        final responseData = jsonDecode(response.body);
        _addLog('Server response: ${responseData['message']}');
      } else {
        // Failed to send location data
        _addLog(
            'Failed to send location data. Status code: ${response.statusCode}');
        _addLog('Response: ${response.body}');
      }
    } catch (error) {
      _addLog('Error sending location data: $error');
    } finally {
      _isSendingLocation = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Track You Core Example'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.bug_report),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                builder: (context) => _buildDebugPanel(),
              );
            },
            tooltip: 'Show Debug Info',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Platform info
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Device Information',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text('Platform: ${_platformName ?? 'Loading...'}'),
                    Text('Version: ${_platformVersion ?? 'Loading...'}'),
                    Text(
                        'Channel name: ${Platform.isAndroid ? 'track_you_core_android' : 'track_you_core_ios'}'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Location service controls
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Location Service',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Status: ${_isServiceRunning ? 'Running' : 'Stopped'}',
                      style: TextStyle(
                        color: _isServiceRunning ? Colors.green : Colors.red,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        ElevatedButton.icon(
                          onPressed:
                              _isServiceRunning ? null : _startLocationService,
                          icon: const Icon(Icons.play_arrow),
                          label: const Text('Start Service'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: Colors.grey,
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed:
                              _isServiceRunning ? _stopLocationService : null,
                          icon: const Icon(Icons.stop),
                          label: const Text('Stop Service'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Location Data display
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Location Data',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    if (_lastLocation == null)
                      const Text('No location data available')
                    else
                      ..._buildLocationInfo(),
                  ],
                ),
              ),
            ),

            // Error message (if any)
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Card(
                color: Colors.red.shade100,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Error:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(_errorMessage!),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDebugPanel() {
    return DraggableScrollableSheet(
      initialChildSize: 0.4,
      minChildSize: 0.2,
      maxChildSize: 0.8,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          color: Colors.grey[100],
          child: Column(
            children: [
              Container(
                color: Colors.blue,
                padding: const EdgeInsets.all(8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Debug Log',
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.white),
                          onPressed: _clearLogs,
                          tooltip: 'Clear logs',
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white),
                          onPressed: () => Navigator.pop(context),
                          tooltip: 'Close',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: _logMessages.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      child: Text(
                        _logMessages[index],
                        style: const TextStyle(fontSize: 12),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildLocationInfo() {
    if (_lastLocation == null) return [];

    return [
      _buildLocationRow('Latitude', _lastLocation!['latitude']),
      _buildLocationRow('Longitude', _lastLocation!['longitude']),
      _buildLocationRow('Altitude', _lastLocation!['altitude']),
      _buildLocationRow('Accuracy', _lastLocation!['accuracy']),
      _buildLocationRow('Speed', _lastLocation!['speed']),
      _buildLocationRow('Bearing', _lastLocation!['bearing']),
      _buildLocationRow(
          'Timestamp',
          DateTime.fromMillisecondsSinceEpoch(
                  _lastLocation!['timestamp'] as int)
              .toString()),
    ];
  }

  Widget _buildLocationRow(String title, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Text(
            '$title: ',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          Expanded(
            child: Text(
              '$value',
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
