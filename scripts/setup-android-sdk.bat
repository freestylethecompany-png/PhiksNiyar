@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
set "ANDROID_HOME=C:\AndroidSDK"
echo Accepting SDK licenses...
(for /l %%x in (1, 1, 10) do echo y) | "C:\AndroidSDK\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
echo Installing Android SDK platforms and build tools...
"C:\AndroidSDK\cmdline-tools\latest\bin\sdkmanager.bat" "platforms;android-36" "platforms;android-34" "build-tools;34.0.0" "platform-tools"
