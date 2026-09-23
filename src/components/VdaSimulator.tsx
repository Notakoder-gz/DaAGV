import React, { useState } from 'react';
import { EditorState } from '../store/editorStore';
import { VdaOrderPayload, VdaNode, VdaEdge, VdaAction } from '../types/map';
import { Terminal, Send, Play, CheckCircle2, Cpu, AlertTriangle, ListFilter } from 'lucide-react';

interface VdaSimulatorProps {
  state: EditorState;
}

export const VdaSimulator: React.FC<VdaSimulatorProps> = ({ state }) => {
  const [selectedSiteCode, setSelectedSiteCode] = useState<number | ''>('');
  const [actionType, setActionType] = useState<string>('pick');
  const [orderLogs, setOrderLogs] = useState<Array<{ time: string; type: string; message: string }>>([
    {
      time: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'VDA 5050 Protocol Command Station Initialized. Ready for dispatch.',
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

  const handleAddNodeToOrder = () => {
    if (selectedSiteCode === '') return;
    const site = state.trafficMap.sites.find((s) => s.code === Number(selectedSiteCode));
    if (!site) return;

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

    // Connect with edge if previous node exists
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
        maxSpeed: 1.0,
      };
      newEdges.push(newEdge);
    }

    setCurrentOrder((prev) => ({
      ...prev,
      timestamp: new Date().toISOString(),
      nodes: [...prev.nodes, newNode],
      edges: newEdges,
    }));

    setOrderLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        type: 'success',
        message: `Added Site #${site.code} (${site.name}) with action '${actionType}' to VDA 5050 Order queue.`,
      },
    ]);
  };

  const handleDispatchOrder = () => {
    if (currentOrder.nodes.length === 0) return;

    setOrderLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        type: 'dispatch',
        message: `Dispatched VDA 5050 Order [${currentOrder.orderId}] with ${currentOrder.nodes.length} nodes to topic 'uagv/v2/XRobot/AMR-001/order'.`,
      },
    ]);
  };

  const handleClearOrder = () => {
    setCurrentOrder({
      headerId: currentOrder.headerId + 1,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      manufacturer: 'XRobot',
      serialNumber: 'AMR-001',
      orderId: `ord_${Date.now()}`,
      orderUpdateId: 0,
      nodes: [],
      edges: [],
    });
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
      {/* Left Dispatch Panel */}
      <div className="w-96 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-base">
            <Cpu className="w-5 h-5" />
            <span>VDA 5050 Command Center</span>
          </div>

          <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Build VDA Mission Sequence
            </h3>

            <div>
              <label className="text-xs text-slate-300">Target Site / Waypoint:</label>
              <select
                value={selectedSiteCode}
                onChange={(e) => setSelectedSiteCode(e.target.value ? Number(e.target.value) : '')}
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
              <label className="text-xs text-slate-300">Action Type:</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 mt-1 text-xs"
              >
                <option value="pick">Pick Pallet / Load (pick)</option>
                <option value="drop">Drop Pallet / Unload (drop)</option>
                <option value="charge">Dock & Charge Battery (charge)</option>
                <option value="pause">Pause Vehicle (pause)</option>
                <option value="cancelOrder">Cancel Current Order (cancelOrder)</option>
                <option value="none">No Action (Navigate Only)</option>
              </select>
            </div>

            <button
              onClick={handleAddNodeToOrder}
              disabled={selectedSiteCode === ''}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-2 rounded-lg text-xs transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Add Step to Sequence</span>
            </button>
          </div>

          {/* Quick Instant Action Buttons */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Instant Safety Commands
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setOrderLogs((prev) => [
                    ...prev,
                    {
                      time: new Date().toLocaleTimeString(),
                      type: 'warning',
                      message: 'SENT INSTANT ACTION: EMERGENCY STOP (eStop)',
                    },
                  ])
                }
                className="px-3 py-2 bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900 font-semibold rounded-lg text-xs flex items-center space-x-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Emergency Stop</span>
              </button>
              <button
                onClick={() =>
                  setOrderLogs((prev) => [
                    ...prev,
                    {
                      time: new Date().toLocaleTimeString(),
                      type: 'info',
                      message: 'SENT INSTANT ACTION: PAUSE MOTION',
                    },
                  ])
                }
                className="px-3 py-2 bg-amber-950/80 border border-amber-800 text-amber-300 hover:bg-amber-900 font-semibold rounded-lg text-xs"
              >
                Pause Motion
              </button>
            </div>
          </div>
        </div>

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

      {/* Right JSON Preview & Real-time Logs */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Top Half: VDA 5050 Payload Inspector */}
        <div className="h-1/2 border-b border-slate-800 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>VDA 5050 v2.0 Order JSON Payload Inspector</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Order ID: {currentOrder.orderId}
            </span>
          </div>
          <pre className="flex-1 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-auto select-text">
            {JSON.stringify(currentOrder, null, 2)}
          </pre>
        </div>

        {/* Bottom Half: Console Dispatch Logs */}
        <div className="h-1/2 p-4 flex flex-col overflow-hidden bg-slate-950">
          <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span>AGV Dispatch & Communication Logs</span>
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
