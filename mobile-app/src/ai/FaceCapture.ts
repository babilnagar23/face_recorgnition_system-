export async function captureFace(photoOutput: any) {
    try {
        if (!photoOutput) {
            throw new Error("Photo output not initialized");
        }

        const photoFile =
            await photoOutput.capturePhotoToFile(
                {
                    flashMode: "off",
                    enableShutterSound: false,
                },
                {}
            );

        if (!photoFile?.filePath) {
            throw new Error("No photo file path returned from capture");
        }

        return {
            path: photoFile.filePath,
            uri: `file://${photoFile.filePath}`,
        };
    } catch (error) {
        console.error("Photo capture failed:", error);
        return null;
    }
}
