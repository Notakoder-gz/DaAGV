import React, { useState } from 'react';
import { EditorState } from '../store/editorStore';
import { VdaOrderPayload, VdaNode, VdaEdge, TrafficSite } from '../types/map';
import {
  Terminal,
  Send,
  Play,
  CheckCircle2,
  Cpu,
  AlertTriangle,
  FileCode,
  Wifi,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

interface VdaSimulatorProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
  selectedSiteFromMap?: TrafficSite | null;
}

export const VdaSimulator: React.FC<VdaSimulatorProps> = ({ state, setState, selectedSiteFromMap }) => {
  const [selectedSiteCode, setSelectedSiteCode] = useState<number | ''>('');
  const [actionType, setActionType] = useState<string>('pick');
  const [activeSubTab, setActiveSubTab] = useState<'inspector' | 'template' | 'mqtt'>('inspector');

  const [orderLogs, setOrderLogs] = useState<Array<{ time: string; type: string; message: string }>>([
    {
      time: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'VDA 5050 Protocol Station Ready.',
    },
  ]);

  const [currentOrder, setCurrentOrder] = useState<VdaOrderPayload>({
    headerId: 1,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    manufacturer: 'XRobot',
    serialNumber: 'AMR-001',
    orderId: `ord_${Date.now()}`,
    orderUpdateId: 0,
    nodes: [],
    edges: [],
  });

  const [jsonStringText, setJsonStringText] = useState<string>(
    JSON.stringify(currentOrder, null, 2)
  );

  const [jsonError, setJsonError] = useState<string | null>(null);

  // Template State
  const [vdaTemplate, setVdaTemplate] = useState<{
    version: string;
    manufacturer: string;
    serialNumber: string;
    defaultMaxSpeed: number;
  }>({
    version: '2.0.0',
    manufacturer: 'XRobot',
    serialNumber: 'AMR-001',
    defaultMaxSpeed: 1.5,
  });

  // Handle direct JSON string edits
  const handleJsonTextChange = (text: string) => {
    setJsonStringText(text);
    try {
      const parsed = JSON.parse(text);
      setCurrentOrder(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  const addSiteToOrder = (site: TrafficSite) => {
    const seqId = currentOrder.nodes.length * 2;
    const newNode: VdaNode = {
      nodeId: `node_${site.code}`,
      sequenceId: seqId,
      released: true,
      actions: [
        {
          actionType,
          actionId: `act_${Date.now()}`,
          actionDescription: `Execute ${actionType} at site ${site.name || site.code}`,
          actionParameters: [],
        },
      ],
      nodePosition: {
        x: site.point.x / 1000.0,
        y: site.point.y / 1000.0,
        theta: site.stop_dir !== undefined && site.stop_dir >= 0 ? (site.stop_dir * Math.PI) / 180.0 : 0,
        mapId: state.projectInfo.project_id || 'default_map',
      },
    };

    let newEdges = [...currentOrder.edges];
    if (currentOrder.nodes.length > 0) {
      const prevNode = currentOrder.nodes[currentOrder.nodes.length - 1];
      const edgeSeqId = seqId - 1;
      const newEdge: VdaEdge = {
        edgeId: `edge_${prevNode.nodeId}_to_${newNode.nodeId}`,
        sequenceId: edgeSeqId,
        released: true,
        startNodeId: prevNode.nodeId,
        endNodeId: newNode.nodeId,
        actions: [],
        maxSpeed: vdaTemplate.defaultMaxSpeed,
      };
      newEdges.push(newEdge);
    }

    const updatedOrder = {
      ...currentOrder,
      timestamp: new Date().toISOString(),
      nodes: [...currentOrder.nodes, newNode],
      edges: newEdges,
    };

    setCurrentOrder(updatedOrder);
    setJsonStringText(JSON.stringify(updatedOrder, null, 2));

    setOrderLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        type: 'success',
        message: `Added Site #${site.code} (${site.name || 'Site'}) [Action: ${actionType}] to order.`,
      },
    ]);
  };

  const handleAddNodeDropdown = () => {
    if (selectedSiteCode === '') return;
    const site = state.trafficMap.sites.find((s) => s.code === Number(selectedSiteCode));
    if (site) {
      addSiteToOrder(site);
    }
  };

  const handleDispatchOrder = () => {
    if (currentOrder.nodes.length === 0) return;

    setOrderLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        type: 'dispatch',
        message: `Dispatched VDA 5050 Order [${currentOrder.orderId}] to ${state.mqtt.ip}:${state.mqtt.port}/${state.mqtt.topicPrefix}/order`,
      },
    ]);
  };

  const handleClearOrder = () => {
    const freshOrder: VdaOrderPayload = {
      headerId: currentOrder.headerId + 1,
      timestamp: new Date().toISOString(),
      version: vdaTemplate.version,
      manufacturer: vdaTemplate.manufacturer,
      serialNumber: vdaTemplate.serialNumber,
      orderId: `ord_${Date.now()}`,
      orderUpdateId: 0,
      nodes: [],
      edges: [],
    };
    setCurrentOrder(freshOrder);
    setJsonStringText(JSON.stringify(freshOrder, null, 2));
    setOrderLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        type: 'info',
        message: 'Order queue reset.',
      },
    ]);
  };

  return (
    <div className="flex flex-1 h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Mission Builder & Config Panel */}
      <div className="w-96 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>VDA 5050 Command Center</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                state.mqtt.connected
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {state.mqtt.connected ? 'MQTT Connected' : 'MQTT Standby'}
            </span>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('inspector')}
              className={`flex-1 py-1.5 rounded font-medium ${
                activeSubTab === 'inspector'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sequence
            </button>
            <button
              onClick={() => setActiveSubTab('template')}
              className={`flex-1 py-1.5 rounded font-medium ${
                activeSubTab === 'template'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Template
            </button>
            <button
              onClick={() => setActiveSubTab('mqtt')}
              className={`flex-1 py-1.5 rounded font-medium ${
                activeSubTab === 'mqtt'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MQTT Broker
            </button>
          </div>

          {/* Sequence Builder Panel */}
          {activeSubTab === 'inspector' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Build Order Step
                </h3>

                <div>
                  <label className="text-xs text-slate-300">Target Waypoint / Site:</label>
                  <select
                    value={selectedSiteCode}
                    onChange={(e) =>
                      setSelectedSiteCode(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 mt-1 text-xs"
                  >
                    <option value="">Select Target Site...</option>
                    {state.trafficMap.sites.map((s) => (
                      <option key={s.code} value={s.code}>
                        Site #{s.code} - {s.name || `Waypoint ${s.code}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300">Node Action Type:</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 mt-1 text-xs"
                  >
                    <option value="pick">Pick Load / Pallet (pick)</option>
                    <option value="drop">Drop Load / Pallet (drop)</option>
                    <option value="charge">Dock & Charge (charge)</option>
                    <option value="pause">Pause Vehicle (pause)</option>
                    <option value="cancelOrder">Cancel Order (cancelOrder)</option>
                    <option value="none font-normal">None (Navigate Only)</option>
                  </select>
                </div>

                <button
                  onClick={handleAddNodeDropdown}
                  disabled={selectedSiteCode === ''}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-2 rounded-lg text-xs transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Add Node to Order</span>
                </button>
              </div>

              {/* Instant Safety Controls */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Instant Safety Controls
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setOrderLogs((prev) => [
                        ...prev,
                        {
                          time: new Date().toLocaleTimeString(),
                          type: 'warning',
                          message: 'EMERGENCY STOP (eStop) DISPATCHED',
                        },
                      ])
                    }
                    className="px-3 py-2 bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900 font-semibold rounded-lg text-xs flex items-center space-x-1.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>eStop</span>
                  </button>
                  <button
                    onClick={() =>
                      setOrderLogs((prev) => [
                        ...prev,
                        {
                          time: new Date().toLocaleTimeString(),
                          type: 'info',
                          message: 'PAUSE MOTION DISPATCHED',
                        },
                      ])
                    }
                    className="px-3 py-2 bg-amber-950/80 border border-amber-800 text-amber-300 hover:bg-amber-900 font-semibold rounded-lg text-xs"
                  >
                    Pause
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template Configurator */}
          {activeSubTab === 'template' && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h3 className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>VDA 5050 Schema Template</span>
              </h3>

              <div>
                <label className="text-slate-400">VDA Version:</label>
                <input
                  type="text"
                  value={vdaTemplate.version}
                  onChange={(e) => setVdaTemplate({ ...vdaTemplate, version: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400">Manufacturer ID:</label>
                <input
                  type="text"
                  value={vdaTemplate.manufacturer}
                  onChange={(e) => setVdaTemplate({ ...vdaTemplate, manufacturer: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Robot Serial Number:</label>
                <input
                  type="text"
                  value={vdaTemplate.serialNumber}
                  onChange={(e) => setVdaTemplate({ ...vdaTemplate, serialNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400">Default Edge Speed (m/s):</label>
                <input
                  type="number"
                  step="0.1"
                  value={vdaTemplate.defaultMaxSpeed}
                  onChange={(e) =>
                    setVdaTemplate({ ...vdaTemplate, defaultMaxSpeed: parseFloat(e.target.value) || 1.0 })
                  }
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1 font-mono"
                />
              </div>
            </div>
          )}

          {/* MQTT Broker Settings */}
          {activeSubTab === 'mqtt' && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h3 className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>MQTT Broker Connection</span>
              </h3>

              <div>
                <label className="text-slate-400">Broker IP / Host:</label>
                <input
                  type="text"
                  value={state.mqtt.ip}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      mqtt: { ...prev.mqtt, ip: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400">Port:</label>
                <input
                  type="number"
                  value={state.mqtt.port}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      mqtt: { ...prev.mqtt, port: parseInt(e.target.value, 10) || 1883 },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400">Topic Prefix:</label>
                <input
                  type="text"
                  value={state.mqtt.topicPrefix}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      mqtt: { ...prev.mqtt, topicPrefix: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1 font-mono"
                />
              </div>

              <button
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    mqtt: { ...prev.mqtt, connected: !prev.mqtt.connected },
                  }));
                  setOrderLogs((prev) => [
                    ...prev,
                    {
                      time: new Date().toLocaleTimeString(),
                      type: state.mqtt.connected ? 'info' : 'success',
                      message: state.mqtt.connected
                        ? 'Disconnected from MQTT Broker.'
                        : `Connected to MQTT Broker @ tcp://${state.mqtt.ip}:${state.mqtt.port}`,
                    },
                  ]);
                }}
                className={`w-full py-2 rounded font-semibold text-xs transition-colors ${
                  state.mqtt.connected
                    ? 'bg-red-900/60 border border-red-700 text-red-200 hover:bg-red-900'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {state.mqtt.connected ? 'Disconnect Broker' : 'Connect to MQTT Broker'}
              </button>
            </div>
          )}
        </div>

        {/* Dispatch Action */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={handleDispatchOrder}
            disabled={currentOrder.nodes.length === 0}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Dispatch VDA 5050 Order ({currentOrder.nodes.length} Nodes)</span>
          </button>
          <button
            onClick={handleClearOrder}
            className="w-full text-slate-400 hover:text-slate-200 text-xs py-1 text-center"
          >
            Clear Sequence Queue
          </button>
        </div>
      </div>

      {/* Right Editable JSON & State Topic Viewer */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Top Half: Editable VDA 5050 JSON Payload */}
        <div className="h-1/2 border-b border-slate-800 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Editable VDA 5050 Order JSON Payload</span>
            </span>
            {jsonError && <span className="text-xs text-red-400 font-mono">{jsonError}</span>}
          </div>
          <textarea
            value={jsonStringText}
            onChange={(e) => handleJsonTextChange(e.target.value)}
            className="flex-1 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none select-text"
          />
        </div>

        {/* Bottom Half: AGV State Topic Monitor & Communication Logs */}
        <div className="h-1/2 p-4 flex flex-col overflow-hidden bg-slate-950">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>
                AGV State Topic Monitor (`{state.mqtt.topicPrefix}/state`)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Operating Mode: AUTOMATIC | Battery: 92%
            </span>
          </div>

          <div className="flex-1 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-y-auto space-y-2">
            {orderLogs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <span className="text-slate-500 text-[10px]">{log.time}</span>
                <span
                  className={
                    log.type === 'warning'
                      ? 'text-red-400 font-semibold'
                      : log.type === 'dispatch'
                      ? 'text-emerald-400 font-bold'
                      : log.type === 'success'
                      ? 'text-blue-300'
                      : 'text-slate-400'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
