"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface Skill {
  id: string;
  label: string;
}

interface SkillCategory {
  name: string;
  skills: Skill[];
}

interface SkillDropdownProps {
  selectedSkills: string[];
  onApply: (skills: string[]) => void;
  trigger: React.ReactNode;
}

const skillCategories: SkillCategory[] = [
  {
    name: "Home & Maintenance",
    skills: [
      { id: "plumbing", label: "Plumbing" },
      { id: "carpentry", label: "Carpentry" },
      { id: "painting-decorating", label: "Painting & decorating" },
      { id: "packaging", label: "Packaging" },
      { id: "electrical", label: "Electrical" },
      { id: "hvac", label: "HVAC" },
    ],
  },
  {
    name: "Beauty & Wellness",
    skills: [
      { id: "hairdressing", label: "Hairdressing" },
      { id: "makeup-services", label: "Makeup services" },
      { id: "skincare", label: "Skincare" },
      { id: "massage", label: "Massage therapy" },
      { id: "nail-care", label: "Nail care" },
    ],
  },
  {
    name: "Design & Creative",
    skills: [
      { id: "logo-design", label: "Logo Design" },
      { id: "brand-identity", label: "Brand Identity" },
      { id: "illustration", label: "Illustration" },
      { id: "ui-ux", label: "UI/UX Design" },
    ],
  },
];

export function SkillDropdown({
  selectedSkills,
  onApply,
  trigger,
}: SkillDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedSkills, setTempSelectedSkills] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Home & Maintenance", "Beauty & Wellness"]),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const MAX_VISIBLE_SKILLS = 4;

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  // Initialize temp selection when dropdown opens
  const toggleDropdown = () => {
    if (!open) {
      setTempSelectedSkills([...selectedSkills]);
      setSearchQuery("");
    }
    setOpen(!open);
  };

  const toggleSkill = (skillId: string) => {
    setTempSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    );
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const clearAll = () => {
    setTempSelectedSkills([]);
  };

  const handleApply = () => {
    onApply(tempSelectedSkills);
    setOpen(false);
  };

  const filteredCategories = skillCategories
    .map((category) => ({
      ...category,
      skills: category.skills.filter((skill) =>
        skill.label.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.skills.length > 0);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <div onClick={toggleDropdown}>{trigger}</div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Search */}
          <div className="p-4 pb-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Skills List */}
          <div className="px-4 py-3 max-h-80 overflow-y-auto">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.name);
              const visibleSkills = isExpanded
                ? category.skills
                : category.skills.slice(0, MAX_VISIBLE_SKILLS);
              const hasMore = category.skills.length > MAX_VISIBLE_SKILLS;

              return (
                <div key={category.name} className="mb-4">
                  {/* Category Header */}
                  <h3 className="text-xs font-medium text-gray-500 mb-2">
                    {category.name}
                  </h3>

                  {/* Skills */}
                  <div className="space-y-2">
                    {visibleSkills.map((skill) => (
                      <label
                        key={skill.id}
                        className="flex items-center space-x-2.5 cursor-pointer group"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={tempSelectedSkills.includes(skill.id)}
                            onChange={() => toggleSkill(skill.id)}
                            className="appearance-none w-4 h-4 border-2 border-gray-300 rounded checked:bg-brand-900 checked:border-brand-900 focus:ring-2 focus:ring-brand-900 focus:ring-offset-0 cursor-pointer"
                          />
                          {tempSelectedSkills.includes(skill.id) && (
                            <svg
                              className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white pointer-events-none"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={4}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-900">
                          {skill.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Show more/less */}
                  {hasMore && (
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mt-2"
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={clearAll}
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              clear all
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-1.5 bg-brand-900 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
