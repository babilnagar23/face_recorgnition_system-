import React from "react";
import { View } from "react-native";

export default function FaceOverlay({ bounds }: any) {
  if (!bounds) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: bounds.x * 0.6,
        top: bounds.y * 0.6,
        width: bounds.width * 0.6,
        height: bounds.height * 0.6,
        borderWidth: 3,
        borderColor: "lime",
        borderRadius: 10,
        zIndex: 999,
      }}
    />
  );
}