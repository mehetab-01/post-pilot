import { useState } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { createTemplate } from '@/services/templates'

const CATEGORIES = [
  { value: 'career',    label: 'Career' },
  { value: 'project',   label: 'Project' },
  { value: 'tutorial',  label: 'Tutorial' },
  { value: 'opinion',   label: 'Opinion' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'custom',    label: 'Custom' },
]

export function SaveTemplateModal({ open, onClose, context }) {
  const [name, setName]           = useState('')
  const [category, setCategory]   = useState('custom')
  const [description, setDesc]    = useState('')
  const [saving, setSaving]       = useState(false)

  async function handleSave() {
    if (!name.trim()) return toast.error('Template name is required')
    setSaving(true)
    try {
      await createTemplate({
        name: name.trim(),
        category,
        description: description.trim() || null,
        context_template: context,
      })
      toast.success('Template saved!')
      setName('')
      setCategory('custom')
      setDesc('')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Save as Template"
      description="Save this context as a reusable template for future posts."
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Career Update, Project Launch…"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:outline-none focus:border-amber/50 transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="When should this template be used?"
        />

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted border border-border hover:text-text hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber/90 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
