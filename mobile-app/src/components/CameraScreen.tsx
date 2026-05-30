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
    checkHeadTurn,
    isLivenessPassed,
    resetLiveness,
} from "../ai/LivenessDetector";

export default function CameraScreen() {
    const device = useCameraDevice("front");
    const { hasPermission, requestPermission } = useCameraPermission();

    const [status, setStatus] = React.useState("Blink");
    const [mode, setMode] = React.useState<"register" | "login">("register");
    const [faceBounds, setFaceBounds] = React.useState<any>(null);

    const cameraRef = React.useRef(null);
    const photoOutput = usePhotoOutput({
        qualityPrioritization: "speed",
        quality: 0.85,
    });

    const isMountedRef = React.useRef(true);
    const statusRef = React.useRef("Blink");
    const modeRef = React.useRef<"register" | "login">("register");
    const captureInProgressRef = React.useRef(false);
    const lastBoundsUpdateRef = React.useRef(0);
    const lastLogRef = React.useRef(0);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    function updateStatus(nextStatus: string) {
        if (statusRef.current !== nextStatus) {
            statusRef.current = nextStatus;

            if (isMountedRef.current) {
                setStatus(nextStatus);
            }
        }
    }

    function resetFlow(nextMode: "register" | "login") {
        resetLiveness();
        modeRef.current = nextMode;
        captureInProgressRef.current = false;
        setMode(nextMode);
        updateStatus("Blink");

        if (isMountedRef.current) {
            setFaceBounds(null);
        }
    }

    async function submitCapturedFace(photoUri: string) {
        if (modeRef.current === "register") {
            await registerFace("EMP001", photoUri);
            updateStatus("Registered");
            return;
        }

        const result = await loginFace("EMP001", photoUri);
        updateStatus(result.authenticated ? "Authenticated" : "Access Denied");
    }

    function handleFacesDetected(faces: Face[]) {
        if (
            statusRef.current === "Registered" ||
            statusRef.current === "Authenticated" ||
            statusRef.current === "Access Denied" ||
            captureInProgressRef.current
        ) {
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

        if (now - lastBoundsUpdateRef.current > 120) {
            lastBoundsUpdateRef.current = now;

            if (isMountedRef.current) {
                setFaceBounds(face.bounds);
            }
        }

        if (now - lastLogRef.current > 1500) {
            lastLogRef.current = now;
            console.log("Face status:", {
                status: statusRef.current,
                yaw: face.yawAngle ?? "N/A",
                leftEye: face.leftEyeOpenProbability ?? "N/A",
                rightEye: face.rightEyeOpenProbability ?? "N/A",
            });
        }

        const yaw = face.yawAngle ?? 0;

        if (statusRef.current === "Blink" && checkBlink(face)) {
            updateStatus("Turn Left");
        }

        if (statusRef.current === "Turn Left" && yaw < -15) {
            updateStatus("Turn Right");
        }

        if (statusRef.current === "Turn Right" && yaw > 15) {
            updateStatus("Verifying...");
        }

        checkHeadTurn(face);

        if (!isLivenessPassed()) {
            return;
        }

        captureInProgressRef.current = true;
        updateStatus("Verified");

        captureFace(photoOutput)
            .then(async (photo) => {
                if (!photo?.uri) {
                    updateStatus("Capture Failed");
                    captureInProgressRef.current = false;
                    return;
                }

                await submitCapturedFace(photo.uri);
            })
            .catch((err) => {
                console.log("Capture/upload error:", err);
                updateStatus("Capture Failed");
                captureInProgressRef.current = false;
            });
    }

    const faceDetectorOutput = useFaceDetectorOutput({
        onFacesDetected: handleFacesDetected,
        onError: (error) => {
            console.log("FACE DETECTOR ERROR:", error);
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
                        do not Register 
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
                        Login
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
