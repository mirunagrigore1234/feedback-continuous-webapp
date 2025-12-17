//Logica pentru crearea și listarea activităților; preia datele trimise de profesor
import Activity from "../entities/Activity.js";

async function createActivity(payload) {
  return await Activity.create(payload);
}

async function getActivityByCode(accessCode) {
  return await Activity.findOne({
    where: { AccessCode: accessCode }
  });
}

async function getActivityById(id) {
  return await Activity.findByPk(id);
}

async function getActivities(teacherId) {
  return await Activity.findAll({ where: { TeacherId: teacherId } });
}

async function deleteActivity(id) {
  const elem = await Activity.findByPk(id);
  if (!elem) return null;
  return await elem.destroy();
}

async function updateActivity(id, data) {
  const elem = await Activity.findByPk(id);
  if (!elem) return null;
  return await elem.update(data);
}

export {
  createActivity,
  getActivityByCode,
  getActivityById,
  getActivities,
  deleteActivity,
  updateActivity
};
