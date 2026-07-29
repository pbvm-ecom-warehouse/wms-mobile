/* eslint-disable react/no-unknown-property */
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber/native";
import { Edges, OrbitControls } from "@react-three/drei/native";
import type { StorageCellView } from "../api/putaway-api";
import {
  getCellPosition,
  getRackMeasurements,
  packCellBoxes,
} from "../utils/rack-3d-layout";
import {
  patchExpoGlPixelStore,
  type ExpoGlPixelStoreContext,
} from "../utils/expo-gl-compat";

function skuColor(sku: string) {
  let hash = 0;
  for (const character of sku) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return `hsl(${Math.abs(hash) % 360}, 58%, 56%)`;
}

function RackModel({
  cells,
  selectedCellId,
  onSelectCell,
}: {
  cells: StorageCellView[];
  selectedCellId?: string;
  onSelectCell: (cell: StorageCellView) => void;
}) {
  const rack = useMemo(() => getRackMeasurements(cells), [cells]);
  const postThickness = Math.max(0.035, Math.min(0.09, rack.widthM / 100));
  const beamThickness = Math.max(0.035, Math.min(0.08, rack.heightM / 60));
  const xBoundaries = rack.bayWidthsM.reduce<number[]>(
    (positions, width) => [
      ...positions,
      positions[positions.length - 1] + width,
    ],
    [-rack.widthM / 2],
  );
  const yBoundaries = rack.levelHeightsM.reduce<number[]>(
    (positions, height) => [
      ...positions,
      positions[positions.length - 1] + height,
    ],
    [-rack.heightM / 2],
  );

  return (
    <group position={[0, rack.heightM / 2, 0]}>
      {xBoundaries.flatMap((x, index) =>
        [-rack.depthM / 2, rack.depthM / 2].map((z, side) => (
          <mesh key={`post-${index}-${side}`} position={[x, 0, z]}>
            <boxGeometry
              args={[
                postThickness,
                rack.heightM + beamThickness * 2,
                postThickness,
              ]}
            />
            <meshStandardMaterial
              color="#233044"
              metalness={0.72}
              roughness={0.3}
            />
          </mesh>
        )),
      )}

      {yBoundaries.map((y, index) => (
        <group key={`level-frame-${index}`}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[rack.widthM, beamThickness, rack.depthM]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.55}
              roughness={0.42}
            />
          </mesh>
          {[-rack.depthM / 2, rack.depthM / 2].map((z, side) => (
            <mesh key={`beam-${index}-${side}`} position={[0, y, z]}>
              <boxGeometry
                args={[
                  rack.widthM + postThickness,
                  beamThickness * 1.5,
                  postThickness,
                ]}
              />
              <meshStandardMaterial
                color="#334155"
                metalness={0.65}
                roughness={0.34}
              />
            </mesh>
          ))}
        </group>
      ))}

      {cells.map((cell) => {
        const [x, y, z] = getCellPosition(cell, rack);
        const widthM = rack.bayWidthsM[cell.bay - 1] ?? 1;
        const heightM = rack.levelHeightsM[cell.level - 1] ?? 1;
        const depthM =
          cell.innerDepth && cell.innerDepth > 0
            ? cell.innerDepth / 100
            : rack.depthM;
        const selected = selectedCellId === cell.id;
        const boxes = packCellBoxes(cell);
        return (
          <group key={cell.id} position={[x, y, z]}>
            <mesh
              onClick={(event) => {
                event.stopPropagation();
                onSelectCell(cell);
              }}
            >
              <boxGeometry args={[widthM, heightM, depthM]} />
              <meshStandardMaterial
                color={
                  cell.status === "BLOCKED"
                    ? "#94a3b8"
                    : selected
                      ? "#f59e0b"
                      : "#dbeafe"
                }
                transparent
                opacity={selected ? 0.18 : 0.04}
                roughness={0.55}
              />
              <Edges color={selected ? "#b45309" : "#94a3b8"} threshold={15} />
            </mesh>

            {boxes.map((box) => (
              <mesh
                key={box.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectCell(cell);
                }}
                position={box.position}
              >
                <boxGeometry args={box.size} />
                <meshStandardMaterial
                  color={skuColor(box.sku)}
                  roughness={0.72}
                />
                <Edges color="#334155" threshold={15} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

export function RackSceneNative(props: {
  cells: StorageCellView[];
  selectedCellId?: string;
  onSelectCell: (cell: StorageCellView) => void;
}) {
  const rack = getRackMeasurements(props.cells);
  const span = Math.max(rack.widthM, rack.heightM, rack.depthM);
  const distance = Math.max(4.5, span * 1.55);

  return (
    <Canvas
      camera={{
        position: [
          distance * 0.78,
          Math.max(rack.heightM * 0.78, distance * 0.4),
          distance,
        ],
        fov: 38,
      }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        patchExpoGlPixelStore(
          gl.getContext() as unknown as ExpoGlPixelStoreContext,
        );
      }}
    >
      <color attach="background" args={["#eef3f7"]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight color="#ffffff" groundColor="#cbd5e1" intensity={0.9} />
      <directionalLight
        intensity={1.55}
        position={[rack.widthM, rack.heightM * 1.8, rack.depthM * 3]}
      />
      <RackModel {...props} />
      <OrbitControls
        enableDamping
        enablePan
        maxDistance={distance * 2.2}
        minDistance={Math.max(2.2, distance * 0.42)}
        target={[0, rack.heightM / 2, 0]}
      />
    </Canvas>
  );
}
