import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Connection,
  Edge,
  NodeProps,
  ReactFlowProvider,
  useReactFlow,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Mail, MessageSquare, Sliders, Activity, Plus, Settings2, Play, Save, CheckCircle2, ChevronRight, X, Trash2, Link } from 'lucide-react';
import { toast } from 'sonner';

const triggerNodeStyle = {
  background: '#fff',
  border: '2px solid rgba(16, 185, 129, 0.3)',
  borderRadius: '12px',
  padding: '16px',
  width: 250,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

const conditionNodeStyle = {
  background: '#fff',
  border: '2px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '12px',
  padding: '16px',
  width: 250,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

const actionNodeStyle = {
  background: '#fff',
  border: '2px solid rgba(244, 63, 94, 0.3)',
  borderRadius: '12px',
  padding: '16px',
  width: 250,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

const TriggerNode = ({ data, selected }: NodeProps) => {
  return (
    <div style={{...triggerNodeStyle, borderColor: selected ? '#10b981' : triggerNodeStyle.border.split(' ')[2]}} className="relative bg-background transition-colors">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Trigger</div>
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground">{data.label as string}</h4>
          <p className="text-[10px] text-muted-foreground">{data.subLabel as string}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500" />
    </div>
  );
};

const ConditionNode = ({ data, selected }: NodeProps) => {
  return (
    <div style={{...conditionNodeStyle, borderColor: selected ? '#3b82f6' : conditionNodeStyle.border.split(' ')[2]}} className="relative bg-background transition-colors">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Condition</div>
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground">{data.label as string}</h4>
          <p className="text-[10px] text-muted-foreground">{data.subLabel as string}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="true" className="w-3 h-3 bg-emerald-500 top-1/3" />
      <Handle type="source" position={Position.Right} id="false" className="w-3 h-3 bg-rose-500 top-2/3" />
    </div>
  );
};

const ActionNode = ({ data, selected }: NodeProps) => {
  return (
    <div style={{...actionNodeStyle, borderColor: (selected ? data.colorTheme : (data.colorTheme ? `${data.colorTheme}4d` : actionNodeStyle.border.split(' ')[2])) as string}} className="relative bg-background transition-colors">
      <Handle type="target" position={Position.Left} className="w-3 h-3" style={{ backgroundColor: (data.colorTheme as string) || '#f43f5e' }} />
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: (data.colorTheme as string) || '#f43f5e' }}>{data.typeLabel as string}</div>
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${data.colorTheme as string}1a`, color: data.colorTheme as string }}>
          {data.icon === 'mail' && <Mail className="w-4 h-4" />}
          {data.icon === 'message' && <MessageSquare className="w-4 h-4" />}
          {data.icon === 'settings' && <Settings2 className="w-4 h-4" />}
          {data.icon === 'link' && <Link className="w-4 h-4" />}
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground">{data.label as string}</h4>
          <p className="text-[10px] text-muted-foreground">{data.subLabel as string}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" style={{ backgroundColor: (data.colorTheme as string) || '#f43f5e' }} />
    </div>
  );
};

const initialNodes = [
  { 
    id: '1', 
    type: 'triggerNode', 
    position: { x: 50, y: 150 }, 
    data: { label: 'Milestone Reached', subLabel: 'Khách hàng đạt hạng Vàng' } 
  },
  { 
    id: '2', 
    type: 'conditionNode', 
    position: { x: 400, y: 150 }, 
    data: { label: 'Check Opt-In', subLabel: 'Đã đăng ký nhận Email' } 
  },
  { 
    id: '3', 
    type: 'actionNode', 
    position: { x: 800, y: 50 }, 
    data: { typeLabel: 'Action : True', label: 'Gửi Email Tri Ân', subLabel: 'Template: Chào mừng hạng Vàng', icon: 'mail', colorTheme: '#f43f5e' } 
  },
  { 
    id: '4', 
    type: 'actionNode', 
    position: { x: 800, y: 250 }, 
    data: { typeLabel: 'Action : False', label: 'Gửi SMS Thông Báo', subLabel: 'Nâng hạng Vàng thành công', icon: 'message', colorTheme: '#a855f7' } 
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false', animated: true, style: { stroke: '#f43f5e', strokeWidth: 2 }, strokeDasharray: '5 5' },
];

function WorkflowBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const nodeTypes = useMemo(() => ({
    triggerNode: TriggerNode,
    conditionNode: ConditionNode,
    actionNode: ActionNode,
  }), []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } 
    } as any, eds)),
    [setEdges],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, data: nodeData }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typeData = event.dataTransfer.getData('application/reactflow');
      if (!typeData) return;

      const { type, data } = JSON.parse(typeData);

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowWrapper.current ? screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) : { x: 0, y: 0 };

      const newNode = {
        id: `node_${new Date().getTime()}`,
        type,
        position,
        data: { ...data },
      };

      setNodes((nds) => nds.concat(newNode as any));
    },
    [screenToFlowPosition, setNodes],
  );

  const onNodeClick = (event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const updateNodeData = (key: string, value: string) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              [key]: value,
            },
          };
        }
        return node;
      }) as any
    );
    setSelectedNode((prev: any) => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value
      }
    }));
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const saveWorkflow = () => {
    toast.success("Workflow saved successfully");
  }

  return (
    <div className="h-[700px] w-full border border-border bg-card rounded-[10px] overflow-hidden flex relative">
      <div className="w-64 bg-muted/20 border-r border-border p-4 flex flex-col gap-6 z-10 overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Nodes</h3>
          <div className="space-y-3">
            <div 
              className="p-3 border border-emerald-500/30 bg-emerald-500/5 rounded-[8px] cursor-grab active:cursor-grabbing hover:bg-emerald-500/10 transition"
              onDragStart={(e) => onDragStart(e, 'triggerNode', { label: 'New Trigger', subLabel: 'Khởi tạo luồng' })}
              draggable
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-foreground">Trigger</span>
              </div>
            </div>

            <div 
              className="p-3 border border-blue-500/30 bg-blue-500/5 rounded-[8px] cursor-grab active:cursor-grabbing hover:bg-blue-500/10 transition"
              onDragStart={(e) => onDragStart(e, 'conditionNode', { label: 'New Condition', subLabel: 'Rẽ nhánh luồng' })}
              draggable
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-foreground">Condition</span>
              </div>
            </div>

            <div 
              className="p-3 border border-rose-500/30 bg-rose-500/5 rounded-[8px] cursor-grab active:cursor-grabbing hover:bg-rose-500/10 transition flex flex-col gap-2"
              onDragStart={(e) => onDragStart(e, 'actionNode', { typeLabel: 'Action', label: 'Send Email', subLabel: 'Gửi Email', icon: 'mail', colorTheme: '#f43f5e' })}
              draggable
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-bold text-foreground">Email Action</span>
              </div>
            </div>

            <div 
              className="p-3 border border-purple-500/30 bg-purple-500/5 rounded-[8px] cursor-grab active:cursor-grabbing hover:bg-purple-500/10 transition flex flex-col gap-2"
              onDragStart={(e) => onDragStart(e, 'actionNode', { typeLabel: 'Action', label: 'Send SMS', subLabel: 'Gửi tin nhắn', icon: 'message', colorTheme: '#a855f7' })}
              draggable
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-foreground">SMS Action</span>
              </div>
            </div>

            <div 
              className="p-3 border border-blue-500/30 bg-blue-500/5 rounded-[8px] cursor-grab active:cursor-grabbing hover:bg-blue-500/10 transition flex flex-col gap-2"
              onDragStart={(e) => onDragStart(e, 'actionNode', { typeLabel: 'Action', label: 'Add Webhook', subLabel: 'Call API', icon: 'link', colorTheme: '#3b82f6' })}
              draggable
            >
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-foreground">Webhook</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat bg-opacity-5"
        >
          <MiniMap 
            nodeStrokeColor={(n) => {
              if (n.type === 'triggerNode') return '#10b981';
              if (n.type === 'conditionNode') return '#3b82f6';
              if (n.type === 'actionNode') return '#f43f5e';
              return '#eee';
            }}
            nodeColor={(n) => {
              return '#fff';
            }}
            nodeBorderRadius={2}
          />
          <Controls />
          <Background color="#ccc" gap={16} />
        </ReactFlow>

        <div className="absolute top-4 right-4 z-10 flex gap-2 border bg-background/80 p-1.5 rounded-[10px] backdrop-blur shadow-sm">
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-md transition"
            onClick={saveWorkflow}
          >
            <Play className="w-3 h-3" /> Test Workflow
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-md transition"
            onClick={saveWorkflow}
          >
            <Save className="w-3 h-3" /> Save Draft
          </button>
        </div>
      </div>

      {selectedNode && (
        <div className="w-64 bg-background border-l border-border p-4 flex flex-col gap-4 z-10 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Edit Node</h3>
            <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-muted rounded-full">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5 p-3 rounded-[8px] bg-muted/30 border border-border">
               <p className="text-xs text-muted-foreground font-medium uppercase">Type</p>
               <p className="text-sm font-bold">{selectedNode.type}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Label</label>
              <input 
                type="text" 
                value={selectedNode.data.label || ''} 
                onChange={(e) => updateNodeData('label', e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 bg-muted/40 border border-border rounded-md focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Sub Label</label>
              <input 
                type="text" 
                value={selectedNode.data.subLabel || ''} 
                onChange={(e) => updateNodeData('subLabel', e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 bg-muted/40 border border-border rounded-md focus:outline-none focus:border-primary"
              />
            </div>

            {selectedNode.type === 'actionNode' && (
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-muted-foreground uppercase">Action Type Label</label>
                 <input 
                   type="text" 
                   value={selectedNode.data.typeLabel || ''} 
                   onChange={(e) => updateNodeData('typeLabel', e.target.value)}
                   className="w-full text-sm font-medium px-3 py-2 bg-muted/40 border border-border rounded-md focus:outline-none focus:border-primary"
                 />
               </div>
            )}
            
            <div className="pt-4 border-t border-border">
              <button 
                onClick={deleteSelectedNode}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-md text-sm font-bold transition"
              >
                <Trash2 className="w-4 h-4" /> Delete Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}

