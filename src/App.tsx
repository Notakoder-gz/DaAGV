import React, { useState } from 'react';
import { initialEditorState, EditorState } from './store/editorStore';
import { MapSerializer } from './utils/mapSerializer';
import { Toolbar } from './components/Toolbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { MapCanvas } from './components/MapCanvas';
import { VdaSimulator } from './components/VdaSimulator';

export default function App() {
  const [state, setState] = useState<EditorState>(initialEditorState);

  // Custom File Import Handler
  const handleImportFiles = (files: FileList) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      if (file.name === 'map.json') {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const mapConfig = MapSerializer.parseMapJson(text);
          setState((prev) => ({ ...prev, mapConfig }));
        };
        reader.readAsText(file);
      } else if (file.name === 'project_info.json') {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const projectInfo = MapSerializer.parseProjectInfo(text);
          setState((prev) => ({ ...prev, projectInfo }));
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.json')) {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const trafficMap = MapSerializer.parseTrafficMap(text);
          setState((prev) => ({ ...prev, trafficMap }));
        };
        reader.readAsText(file);
      } else if (
        file.name.endsWith('.png') ||
        file.name.endsWith('.pgm') ||
        file.name.endsWith('.jpg') ||
        file.name.endsWith('.jpeg')
      ) {
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = img.width;
            offscreenCanvas.height = img.height;
            const ctx = offscreenCanvas.getContext('2d');
            if (ctx) ctx.drawImage(img, 0, 0);

            setState((prev) => ({
              ...prev,
              baseMapCanvas: offscreenCanvas,
              baseMapLoaded: true,
              mapConfig: { ...prev.mapConfig, width: img.width, height: img.height },
            }));
          };
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleExportProject = () => {
    const serializedMap = MapSerializer.serializeMapJson(state.mapConfig);
    const serializedProjInfo = MapSerializer.serializeProjectInfo(state.projectInfo);
    const serializedTraffic = MapSerializer.serializeTrafficMap(state.trafficMap);

    downloadFile(
      serializedTraffic,
      `${state.projectInfo.project_id || 'map'}_traffic.json`,
      'application/json'
    );
    downloadFile(serializedMap, 'map.json', 'application/json');
    downloadFile(serializedProjInfo, 'project_info.json', 'application/json');

    if (state.baseMapCanvas) {
      state.baseMapCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'new_map.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      <Toolbar state={state} setState={setState} />

      {state.mainTab === 'editor' ? (
        <div className="flex flex-1 overflow-hidden relative">
          <LeftSidebar
            state={state}
            setState={setState}
            onImportFiles={handleImportFiles}
            onExportProject={handleExportProject}
          />

          <div className="flex-1 h-full relative">
            <MapCanvas state={state} setState={setState} />
          </div>

          <RightSidebar state={state} setState={setState} />
        </div>
      ) : (
        <VdaSimulator state={state} />
      )}
    </div>
  );
}
