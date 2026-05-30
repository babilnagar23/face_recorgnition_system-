let blinkDetected = false;
let leftTurnDetected = false;
let rightTurnDetected = false;
let completed = false;



export function checkBlink(face: any): boolean {
    const left = face.leftEyeOpenProbability ?? 1;
    const right = face.rightEyeOpenProbability ?? 1;

    if (left < 0.3 && right < 0.3) {
        blinkDetected = true;
        return true;
    }
    return false;
}

export function checkHeadTurn(face: any) {
    const yaw = face.yawAngle ?? 0;

    if (yaw < -15) {
        leftTurnDetected = true;
    }

    if (yaw > 15) {
        rightTurnDetected = true;
    }
}

export function isLivenessPassed() {
    if (
        blinkDetected &&
        leftTurnDetected &&
        rightTurnDetected &&
        !completed
    ) {
        completed = true;
        return true;
    }

    return false;
}

export function resetLiveness() {
  blinkDetected = false;
  leftTurnDetected = false;
  rightTurnDetected = false;
  completed = false;
 
  console.log("🔄 Liveness Reset");
}