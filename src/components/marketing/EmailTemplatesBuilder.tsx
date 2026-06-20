import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Mail, Plus, Save, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

export function EmailTemplatesBuilder() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem("marketing_custom_email_templates");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "1",
        name: "Welcome Coupon",
        subject: "Welcome to Elite Club! Here is your special gift",
        content: "<p>Hi {customer_name},</p><p>Welcome! Your current balance is {points_balance} points.</p>"
      }
    ];
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(templates.length > 0 ? templates[0].id : null);
  const [isSaving, setIsSaving] = useState(false);

  const activeTemplate = templates.find(t => t.id === activeTemplateId);

  const handleUpdateActiveTemplate = (updates: Partial<EmailTemplate>) => {
    if (!activeTemplateId) return;
    setTemplates(prev => prev.map(t => t.id === activeTemplateId ? { ...t, ...updates } : t));
  };

  const handleAddNew = () => {
    const freshTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: "New Template",
      subject: "New Subject",
      content: "<p>Hello {customer_name}, your balance is {points_balance} points.</p>"
    };
    setTemplates([freshTemplate, ...templates]);
    setActiveTemplateId(freshTemplate.id);
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("marketing_custom_email_templates", JSON.stringify(templates));
      setIsSaving(false);
      toast.success("Email templates saved successfully!");
    }, 500);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    if (activeTemplateId === id) {
      setActiveTemplateId(updated.length > 0 ? updated[0].id : null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sidebar: List of templates */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" /> My Templates
                </CardTitle>
                <CardDescription className="text-xs">Manage loyalty email templates</CardDescription>
              </div>
              <button
                onClick={handleAddNew}
                className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-[10px] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 bg-muted/20 border border-dashed rounded-[10px] text-center">
                No templates yet.
              </div>
            ) : (
              templates.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setActiveTemplateId(t.id)}
                  className={`p-3 rounded-[10px] border cursor-pointer transition-all flex items-center justify-between ${activeTemplateId === t.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-background hover:bg-muted/50 border-border'}`}
                >
                  <div className="truncate">
                    <span className={`text-sm font-bold block truncate ${activeTemplateId === t.id ? 'text-primary' : 'text-foreground'}`}>{t.name}</span>
                    <span className="text-xs text-muted-foreground truncate block">{t.subject}</span>
                  </div>
                  <button onClick={(e) => handleDelete(t.id, e)} className="p-1.5 text-muted-foreground hover:text-rose-500 rounded bg-background hover:bg-rose-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Column: Editor */}
      <div className="lg:col-span-8">
        <Card className="bg-card border-border shadow-sm">
          {activeTemplate ? (
            <>
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-sm">
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Template Name</label>
                    <input 
                      type="text" 
                      value={activeTemplate.name}
                      onChange={(e) => handleUpdateActiveTemplate({ name: e.target.value })}
                      className="w-full bg-background border rounded-[10px] p-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-[10px] text-sm flex items-center justify-center transition-all shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
                      Save Changes
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <label className="block text-xs text-muted-foreground font-bold uppercase mb-2">Subject Line</label>
                  <input 
                    type="text" 
                    value={activeTemplate.subject}
                    onChange={(e) => handleUpdateActiveTemplate({ subject: e.target.value })}
                    className="w-full bg-background border rounded-[10px] p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground font-bold uppercase mb-2">Email Content</label>
                  <RichTextEditor 
                    value={activeTemplate.content}
                    onChange={(val) => handleUpdateActiveTemplate({ content: val })}
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-[10px]">
                  <p className="text-xs font-bold text-blue-500 uppercase mb-2">Available Placeholders</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-background border rounded text-xs font-mono text-primary/70">{'{customer_name}'}</span>
                    <span className="px-2 py-1 bg-background border rounded text-xs font-mono text-primary/70">{'{points_balance}'}</span>
                    <span className="px-2 py-1 bg-background border rounded text-xs font-mono text-primary/70">{'{tier_name}'}</span>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Mail className="w-12 h-12 mb-4 opacity-20" />
              <p>Select or create a template to start editing</p>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
