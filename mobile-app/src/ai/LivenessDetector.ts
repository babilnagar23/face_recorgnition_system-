// Liveness Detection State Machine
// Replaces global booleans with proper FSM to handle timeouts and state validation

export enum LivenessState {
    IDLE = "IDLE",
    WAIT_BLINK = "WAIT_BLINK",
    WAIT_LEFT = "WAIT_LEFT",
    WAIT_RIGHT = "WAIT_RIGHT",
    PASSED = "PASSED",
    TIMEOUT = "TIMEOUT",
}

interface LivenessContext {
    state: LivenessState;
    startTime: number;
    blinkTime: number | null;
    leftTime: number | null;
    rightTime: number | null;
    frameCount: number;
    eyesClosedFrames: number;
    headTurnFrames: number;
}

// Constants
const CHALLENGE_TIMEOUT_MS = 10000; // 10 second timeout per challenge
const BLINK_MIN_FRAMES = 3; // Require blink to be closed for at least 3 frames
const HEAD_TURN_MIN_FRAMES = 5; // Require head turn to be held for 5 frames
const YAW_LEFT_THRESHOLD = -18; // Stricter than before (was -15)
const YAW_RIGHT_THRESHOLD = 18;
const EYE_CLOSED_THRESHOLD = 0.4; // Eyes closed if probability < 0.4 (was 0.3)

let livenessContext: LivenessContext = {
    state: LivenessState.IDLE,
    startTime: 0,
    blinkTime: null,
    leftTime: null,
    rightTime: null,
    frameCount: 0,
    eyesClosedFrames: 0,
    headTurnFrames: 0,
};

export function initializeLiveness(): void {
    livenessContext = {
        state: LivenessState.WAIT_BLINK,
        startTime: Date.now(),
        blinkTime: null,
        leftTime: null,
        rightTime: null,
        frameCount: 0,
        eyesClosedFrames: 0,
        headTurnFrames: 0,
    };
}

export function getLivenessState(): LivenessState {
    return livenessContext.state;
}

export function getFrameCount(): number {
    return livenessContext.frameCount;
}

/**
 * Check for blink detection
 * Eyes must be closed (probability < 0.4) for at least 3 consecutive frames
 */
export function checkBlink(face: any): boolean {
    if (livenessContext.state !== LivenessState.WAIT_BLINK) {
        return false;
    }

    const now = Date.now();
    const elapsed = now - livenessContext.startTime;

    // Timeout check
    if (elapsed > CHALLENGE_TIMEOUT_MS) {
        livenessContext.state = LivenessState.TIMEOUT;
        return false;
    }

    const leftEyeClosed = (face.leftEyeOpenProbability ?? 1) < EYE_CLOSED_THRESHOLD;
    const rightEyeClosed = (face.rightEyeOpenProbability ?? 1) < EYE_CLOSED_THRESHOLD;

    if (leftEyeClosed && rightEyeClosed) {
        livenessContext.eyesClosedFrames++;

        if (livenessContext.eyesClosedFrames >= BLINK_MIN_FRAMES) {
            livenessContext.state = LivenessState.WAIT_LEFT;
            livenessContext.startTime = now; // Reset timeout for next stage
            livenessContext.blinkTime = now;
            livenessContext.eyesClosedFrames = 0;
            return true;
        }
    } else {
        livenessContext.eyesClosedFrames = 0;
    }

    return false;
}

/**
 * Check for left head turn
 * Yaw angle must be < -18 degrees for at least 5 consecutive frames
 */
export function checkLeftTurn(face: any): boolean {
    if (livenessContext.state !== LivenessState.WAIT_LEFT) {
        return false;
    }

    const now = Date.now();
    const elapsed = now - livenessContext.startTime;

    // Timeout check
    if (elapsed > CHALLENGE_TIMEOUT_MS) {
        livenessContext.state = LivenessState.TIMEOUT;
        return false;
    }

    const yaw = face.yawAngle ?? 0;

    if (yaw < YAW_LEFT_THRESHOLD) {
        livenessContext.headTurnFrames++;

        if (livenessContext.headTurnFrames >= HEAD_TURN_MIN_FRAMES) {
            livenessContext.state = LivenessState.WAIT_RIGHT;
            livenessContext.startTime = now; // Reset timeout
            livenessContext.leftTime = now;
            livenessContext.headTurnFrames = 0;
            return true;
        }
    } else {
        livenessContext.headTurnFrames = 0;
    }

    return false;
}

/**
 * Check for right head turn
 * Yaw angle must be > 18 degrees for at least 5 consecutive frames
 */
export function checkRightTurn(face: any): boolean {
    if (livenessContext.state !== LivenessState.WAIT_RIGHT) {
        return false;
    }

    const now = Date.now();
    const elapsed = now - livenessContext.startTime;

    // Timeout check
    if (elapsed > CHALLENGE_TIMEOUT_MS) {
        livenessContext.state = LivenessState.TIMEOUT;
        return false;
    }

    const yaw = face.yawAngle ?? 0;

    if (yaw > YAW_RIGHT_THRESHOLD) {
        livenessContext.headTurnFrames++;

        if (livenessContext.headTurnFrames >= HEAD_TURN_MIN_FRAMES) {
            livenessContext.state = LivenessState.PASSED;
            livenessContext.rightTime = now;
            livenessContext.headTurnFrames = 0;
            return true;
        }
    } else {
        livenessContext.headTurnFrames = 0;
    }

    return false;
}

export function isLivenessPassed(): boolean {
    return livenessContext.state === LivenessState.PASSED;
}

export function isLivenessTimeout(): boolean {
    return livenessContext.state === LivenessState.TIMEOUT;
}

export function resetLiveness(): void {
    livenessContext = {
        state: LivenessState.IDLE,
        startTime: 0,
        blinkTime: null,
        leftTime: null,
        rightTime: null,
        frameCount: 0,
        eyesClosedFrames: 0,
        headTurnFrames: 0,
    };
}