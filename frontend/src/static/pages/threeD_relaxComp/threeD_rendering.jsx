import { Fragment, Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Bounds, Html } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { NavigationBar } from "../components/navBar.jsx";
import "../../css_styles/css_threeD_render_comp/threeD_rendering.css";
import MODEL_PATH from "../../../assets/3d_models/building_models/CDLC_room.fbx?url";

const TEXTURE_PATH = `${import.meta.env.BASE_URL}3d_models/CDLC_room/textures/`;

function FBXModel() {
    const fbx = useLoader(FBXLoader, MODEL_PATH, loader => {
        loader.setResourcePath(TEXTURE_PATH);
    });
    
    const model = useMemo(() => {
        const scene = fbx.clone(true);
        const materials = new Map();

        function PrepareMaterial(source) {
            if (materials.has(source)) return materials.get(source);
            const material = source.clone();

            if (material.emissive && material.name !== "LEDLight") {
            }

            material.needsUpdate = true;
            materials.set(source, material);
            return material;
        }

        scene.traverse(object => {
            if (object.isLight){
                object.visible = false;
            }

            if (!object.isMesh) {
                return;
            }

            object.material = Array.isArray(object.material)
                ? object.material.map(PrepareMaterial)
                : PrepareMaterial(object.material);
        });

        return scene;

    }, [fbx]);

    return <primitive object={model} scale={0.01} position={[0, 0, 0]}/>;
}

export default function Render3DModel() {
    return (
        <Fragment>
            <NavigationBar/>
            <main id="three-d-page" className="three-d-page">
                <h1 id="three-d-title" className="three-d-title">CDLC Room 3D model</h1>
                <section id="three-d-container" className="three-d-container">
                    <Canvas id="three-d-canvas" className="three-d-canvas" camera={{position: [4, 3, 6], fov: 55}}>
                        <color attach="background" args={["#dddddd"]}/>
                        <hemisphereLight args={["#ffffff", "#777777", 1.2]}/>
                        <directionalLight position={[5, 8, 5]} intensity={1.5}/>
                        <Suspense fallback={<Html center>Loading 3D model...</Html>}>
                            <Bounds fit clip observe margin={1.2}>
                                <FBXModel/>
                            </Bounds>
                        </Suspense>
    
                        <OrbitControls makeDefault enableDamping enableZoom enablePan/>
                    </Canvas>
                </section>
            </main>
        </Fragment>
    );
}
