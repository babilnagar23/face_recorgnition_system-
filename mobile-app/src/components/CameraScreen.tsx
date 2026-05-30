import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { captureFace } from "../ai/FaceCapture";
import FaceOverlay from "../components/FaceOverlay";

import {
    registerFace,
    loginFace,
} from "../services/api";

import {
    Face,
    useFaceDetectorOutput,
} from "react-native-vision-camera-face-detector";

import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
} from "react-native-vision-camera";

import {
    checkBlink,
    checkLeftTurn,
    checkRightTurn,
    isLivenessPassed,
    isLivenessTimeout,
    resetLiveness,
    initializeLiveness,
    getLivenessState,
    LivenessState,
} from "../ai/LivenessDetector";

export default function CameraScreen() {
    const device = useCameraDevice("front");
    const { hasPermission, requestPermission } = useCameraPermission();

    const [status, setStatus] = React.useState("Initializing");
    const [mode, setMode] = React.useState<"register" | "login">("register");
    const [faceBounds, setFaceBounds] = React.useState<any>(null);

    const cameraRef = React.useRef(null);
    const photoOutput = usePhotoOutput({
        qualityPrioritization: "speed",
        quality: 0.85,
    });

    // Refs for preventing race conditions
    const isMountedRef = React.useRef(true);
    const modeRef = React.useRef<"register" | "login">("register");
    const captureInProgressRef = React.useRef(false);
    const photoOutputRef = React.useRef(photoOutput); // Store photoOutput ref to avoid stale closure
    const lastBoundsUpdateRef = React.useRef(0);
    const livenessTimeoutRef = React.useRef<any>(null);

    // Update photoOutput ref whenever it changes
    React.useEffect(() => {
        photoOutputRef.current = photoOutput;
    }, [photoOutput]);

    useEffect(() => {
        isMountedRef.current = true;
        initializeLiveness();
        updateStatus("Ready - Position face in frame");

        return () => {
            isMountedRef.current = false;
            if (livenessTimeoutRef.current) {
                clearTimeout(livenessTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    function updateStatus(nextStatus: string) {
        if (isMountedRef.current) {
            setStatus(nextStatus);
        }
    }

    function resetFlow(nextMode: "register" | "login") {
        // Clear any pending timeout
        if (livenessTimeoutRef.current) {
            clearTimeout(livenessTimeoutRef.current);
            livenessTimeoutRef.current = null;
        }

        resetLiveness();
        modeRef.current = nextMode;
        captureInProgressRef.current = false;
        setMode(nextMode);
        
        initializeLiveness(); // Start fresh liveness challenge
        updateStatus("Ready");

        if (isMountedRef.current) {
            setFaceBounds(null);
        }
    }

    async function submitCapturedFace(photoUri: string) {
        try {
            if (modeRef.current === "register") {
                await registerFace("EMP001", photoUri);
                updateStatus("Registered");
                return;
            }

            const result = await loginFace("EMP001", photoUri);
            updateStatus(result.authenticated ? "Authenticated" : "Access Denied");
        } catch (error) {
            console.error("Submit error:", error);
            updateStatus("Submission Failed");
            captureInProgressRef.current = false;
        }
    }

    function handleFacesDetected(faces: Face[]) {
        // Don't process if capture already in progress
        if (captureInProgressRef.current) {
            return;
        }

        if (faces.length === 0) {
            const now = Date.now();

            if (now - lastBoundsUpdateRef.current > 150) {
                lastBoundsUpdateRef.current = now;

                if (isMountedRef.current) {
                    setFaceBounds(null);
                }
            }

            return;
        }

        const face: any = faces[0];
        const now = Date.now();

        // Update face bounds less frequently
        if (now - lastBoundsUpdateRef.current > 120) {
            lastBoundsUpdateRef.current = now;

            if (isMountedRef.current) {
                setFaceBounds(face.bounds);
            }
        }

        // Get current liveness state
        const currentState = getLivenessState();

        // Handle timeout
        if (isLivenessTimeout()) {
            updateStatus("Challenge Timeout - Try Again");
            resetFlow(modeRef.current);
            return;
        }

        // Process liveness challenges based on state machine
        if (currentState === LivenessState.WAIT_BLINK && checkBlink(face)) {
            updateStatus("Blink Detected - Now turn left");
        }

        if (currentState === LivenessState.WAIT_LEFT && checkLeftTurn(face)) {
            updateStatus("Left Turn Detected - Now turn right");
        }

        if (currentState === LivenessState.WAIT_RIGHT && checkRightTurn(face)) {
            updateStatus("Right Turn Detected - Verifying...");
            
            // Mark capture in progress BEFORE attempting capture
            captureInProgressRef.current = true;

            // Small delay to ensure state is set
            setTimeout(() => {
                attemptCapture();
            }, 100);
        }
    }

    async function attemptCapture() {
        try {
            if (!isLivenessPassed()) {
                updateStatus("Liveness check failed");
                captureInProgressRef.current = false;
                return;
            }

            updateStatus("Capturing...");

            // Use the ref to ensure we have the latest photoOutput
            const photo = await captureFace(photoOutputRef.current);

            if (!photo?.uri) {
                updateStatus("Capture Failed - Try Again");
                captureInProgressRef.current = false;
                return;
            }

            await submitCapturedFace(photo.uri);
        } catch (error) {
            console.error("Capture/submit error:", error);
            updateStatus("Capture Failed - Try Again");
            captureInProgressRef.current = false;
        }
    }

    const faceDetectorOutput = useFaceDetectorOutput({
        onFacesDetected: handleFacesDetected,
        onError: (error) => {
            console.error("Face detector error:", error);
        },
        outputResolution: "preview",
        performanceMode: "fast",
        trackingEnabled: true,
        minFaceSize: 0.15,
        runLandmarks: true,
        runContours: false,
        runClassifications: true,
    });

    if (!hasPermission) {
        return <Text>Requesting Camera Permission...</Text>;
    }

    if (!device) {
        return <Text>No Camera Found</Text>;
    }

    return (
        <View style={{ flex: 1 }}>
            <Text
                style={{
                    position: "absolute",
                    top: 50,
                    left: 20,
                    zIndex: 999,
                    color: "red",
                }}
            >
                Camera Loaded
            </Text>

            <Text
                style={{
                    position: "absolute",
                    top: 100,
                    alignSelf: "center",
                    zIndex: 999,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                    color: "white",
                    fontSize: 22,
                    fontWeight: "bold",
                }}
            >
                {status}
            </Text>

            <View
                style={{
                    position: "absolute",
                    top: 170,
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 10,
                    zIndex: 999,
                }}
            >
                <TouchableOpacity onPress={() => resetFlow("register")}>
                    <Text
                        style={{
                            backgroundColor: "blue",
                            color: "white",
                            padding: 10,
                        }}
                    >
                        Cancel
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => resetFlow("login")}>
                    <Text
                        style={{
                            backgroundColor: "green",
                            color: "white",
                            padding: 10,
                        }}
                    >
                        Switch Mode
                    </Text>
                </TouchableOpacity>
            </View>

            <FaceOverlay bounds={faceBounds} />

            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                outputs={[photoOutput, faceDetectorOutput]}
            />
        </View>
    );
}
