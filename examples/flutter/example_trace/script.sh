#!/bin/bash
# Update Gradle, Java and other Android project settings in a Flutter project
# Works with both .gradle and .gradle.kts build files

# See: https://gradle.org/releases/
# See: https://developer.android.com/build/releases/gradle-plugin#compatibility
DESIRED_GRADLE_VERSION="8.11.1"
# Build errors often show the required Java version
DESIRED_JAVA_VERSION="17"
# See: https://developer.android.com/ndk/downloads
DESIRED_NDK_VERSION="27.0.12077973"
# Google Play Stores requires a minimum target SDK version
DESIRED_TARGET_SDK="35"
# The minimum Android SDK version
DESIRED_MIN_SDK_VERSION="24"
# This should be compatible with the DESIRED_GRADLE_VERSION set above
# See: https://developer.android.com/build/releases/gradle-plugin#updating-gradle
DESIRED_ANDROID_APPLICATION_VERSION="8.9.1"


# Exit if this is not a Flutter project
if [ ! -f "pubspec.yaml" ]; then
  echo "This is not a Flutter project"
  exit 1
fi

# Exit if the Android directory does not exist
if [ ! -d "android" ]; then
  echo "The Android directory does not exist"
  exit 1
fi

# Navigate to the Android directory
cd android

# Update Gradle version (if specified)
if [ -n "$DESIRED_GRADLE_VERSION" ]; then
  sed -i '' "s/gradle-.*-all.zip/gradle-${DESIRED_GRADLE_VERSION}-all.zip/" gradle/wrapper/gradle-wrapper.properties
fi

# Detect if using Groovy or Kotlin build gradle file
if [ -f "app/build.gradle.kts" ]; then
  BUILD_GRADLE="app/build.gradle.kts"
else
  BUILD_GRADLE="app/build.gradle"
fi

# Update Java version (if specified)
if [ -n "$DESIRED_JAVA_VERSION" ]; then
  sed -i '' "s/JavaVersion.VERSION_[0-9_]*/JavaVersion.VERSION_${DESIRED_JAVA_VERSION}/" "$BUILD_GRADLE"
fi

# Update NDK version (if specified)
if [ -n "$DESIRED_NDK_VERSION" ]; then
  sed -i '' "s/ndkVersion = .*/ndkVersion = \"${DESIRED_NDK_VERSION}\"/" "$BUILD_GRADLE"
fi

# Update minSdk version (if specified)
if [ -n "$DESIRED_MIN_SDK_VERSION" ]; then
  sed -i '' "s/minSdk = .*/minSdk = ${DESIRED_MIN_SDK_VERSION}/" "$BUILD_GRADLE"
fi

# Update targetSdk version (if specified)
if [ -n "$DESIRED_TARGET_SDK" ]; then
  sed -i '' "s/targetSdk = .*/targetSdk = ${DESIRED_TARGET_SDK}/" "$BUILD_GRADLE"
fi


# Update com.android.application version in settings.gradle (if specified)
if [ -n "$DESIRED_ANDROID_APPLICATION_VERSION" ]; then
  # Detect if using Groovy or Kotlin build gradle file
  if [ -f "settings.gradle.kts" ]; then
    sed -i '' "s/id(\"com.android.application\") version \".*\" apply false/id(\"com.android.application\") version \"${DESIRED_ANDROID_APPLICATION_VERSION}\" apply false/" settings.gradle.kts
  else
    sed -i '' "s/id \"com.android.application\" version \".*\" apply false/id \"com.android.application\" version \"${DESIRED_ANDROID_APPLICATION_VERSION}\" apply false/" settings.gradle
  fi
fi

echo "Android project updated. Run 'git diff android' to see the changes."