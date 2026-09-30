import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Briefcase, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Department } from '../../../shared/types/index.js';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDepartments().then(setDepartments).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Enterprise Departments & Workspaces</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore cross-functional divisions, departmental leaders, active milestones, and knowledge bases
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="enterprise-card p-5 flex flex-col justify-between hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800 text-brand-400 border border-slate-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 leading-none">{dept.name}</h3>
                      <span className="text-[11px] font-mono text-slate-500 uppercase mt-0.5 block">{dept.code}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {dept.description || 'Departmental operations and collaborative workstream.'}
                </p>

                {dept.head_name && (
                  <div className="mt-3 text-xs text-slate-400">
                    <span className="text-slate-500">Department Head: </span>
                    <strong className="text-slate-200">{dept.head_name}</strong>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Members</span>
                    <span className="font-bold text-slate-200 text-sm">{dept.member_count}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Projects</span>
                    <span className="font-bold text-slate-200 text-sm">{dept.project_count}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tasks</span>
                    <span className="font-bold text-slate-200 text-sm">{dept.task_count}</span>
                  </div>
                </div>

                <Link
                  to={`/departments/${dept.id}`}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center justify-end gap-1"
                >
                  <span>Department Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
