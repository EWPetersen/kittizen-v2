import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import StantonMap from './components/StantonMap';
import NavBar from './components/NavBar';
import AlertPanel from './components/AlertPanel';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [showAlerts, setShowAlerts] = useState(false);

  return (
    <AuthProvider>
      <div className="w-full h-full flex flex-col">
        <NavBar onToggleAlerts={() => setShowAlerts(!showAlerts)} />
        
        <div className="relative flex-grow">
          <Canvas className="w-full h-full">
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 0, 0]} intensity={1} color="#F9D71C" />
            <Stars radius={100} depth={50} count={5000} factor={4} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            <StantonMap />
          </Canvas>
          
          {showAlerts && (
            <div className="absolute top-0 right-0 h-full">
              <AlertPanel />
            </div>
          )}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App; 