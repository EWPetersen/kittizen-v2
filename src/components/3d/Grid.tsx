import React from 'react';
import { GridHelper, Color } from 'three';
import { SCALE_FACTOR } from './constants';

interface GridProps {
  size?: number;
  divisions?: number;
  color1?: string;
  color2?: string;
}

export const Grid: React.FC<GridProps> = ({
  size = 100,
  divisions = 100,
  color1 = '#444466',
  color2 = '#555577'
}) => {
  return (
    <gridHelper
      args={[
        size * SCALE_FACTOR, 
        divisions, 
        new Color(color1), 
        new Color(color2)
      ]}
      position={[0, -10, 0]}
      rotation={[0, 0, 0]}
    />
  );
}; 