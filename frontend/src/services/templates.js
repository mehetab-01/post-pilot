import { templatesApi } from './api'

export const listTemplates   = (category) => templatesApi.list(category).then((r) => r.data)
export const getTemplate     = (id)        => templatesApi.get(id).then((r) => r.data)
export const createTemplate  = (data)      => templatesApi.create(data).then((r) => r.data)
export const updateTemplate  = (id, data)  => templatesApi.update(id, data).then((r) => r.data)
export const deleteTemplate  = (id)        => templatesApi.delete(id)
export const useTemplate     = (id)        => templatesApi.use(id).then((r) => r.data)
