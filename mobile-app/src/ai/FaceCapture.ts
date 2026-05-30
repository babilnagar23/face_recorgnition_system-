export async function captureFace(photoOutput: any) {
    try {
        if (!photoOutput) {
            throw new Error("Photo output not ready");
        }

        const photoFile = await photoOutput.capturePhotoToFile(
            {
                flashMode: "off",
                enableShutterSound: false,
            },
            {}
        );

        if (!photoFile?.filePath) {
            throw new Error("No photo file path returned");
        }

        return {
            path: photoFile.filePath,
            uri: `file://${photoFile.filePath}`,
        };
    } catch (error) {
        console.error("Capture Error:", error);
        return null;
    }
}
