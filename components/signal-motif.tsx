import { StyleSheet, View } from "react-native";

import { TasklyColors } from "@/constants/taskly-design";

type SignalMotifProps = {
  color?: string;
  scale?: number;
};

const BAR_HEIGHTS = [18, 34, 52, 28, 64, 42];

export function SignalMotif({ color = TasklyColors.blue, scale = 1 }: SignalMotifProps) {
  return (
    <View style={[styles.container, { height: 68 * scale, gap: 8 * scale }]}>
      {BAR_HEIGHTS.map((height, index) => (
        <View
          key={`${height}-${index}`}
          style={[
            styles.bar,
            {
              width: 10 * scale,
              height: height * scale,
              borderRadius: 999,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  bar: {},
});
