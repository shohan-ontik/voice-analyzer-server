import { sequelize } from '../config/database';
import { User, initUserModel } from './user.model';
import { PracticeSession, initPracticeSessionModel } from './practiceSession.model';
import { ScoreCategory, initScoreCategoryModel } from './scoreCategory.model';
import { TrainingModule, initModuleModel } from './module.model';
import { ModuleChapter, initModuleChapterModel } from './moduleChapter.model';
import { LearningMaterial, initLearningMaterialModel } from './learningMaterial.model';
import { Exam, initExamModel } from './exam.model';
import { UserChapterProgress, initUserChapterProgressModel } from './userChapterProgress.model';
import { UserMaterialProgress, initUserMaterialProgressModel } from './userMaterialProgress.model';
import { Notification, initNotificationModel } from './notification.model';
import { UserNotificationRead, initUserNotificationReadModel } from './userNotificationRead.model';

initUserModel(sequelize);
initPracticeSessionModel(sequelize);
initScoreCategoryModel(sequelize);
initModuleModel(sequelize);
initModuleChapterModel(sequelize);
initLearningMaterialModel(sequelize);
initExamModel(sequelize);
initUserChapterProgressModel(sequelize);
initUserMaterialProgressModel(sequelize);
initNotificationModel(sequelize);
initUserNotificationReadModel(sequelize);

User.hasMany(PracticeSession, {
  foreignKey: 'userId',
  as: 'practiceSessions',
  onDelete: 'CASCADE',
});
PracticeSession.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

TrainingModule.hasMany(ModuleChapter, {
  foreignKey: 'moduleId',
  as: 'chapters',
  onDelete: 'CASCADE',
});
ModuleChapter.belongsTo(TrainingModule, {
  foreignKey: 'moduleId',
  as: 'module',
});

TrainingModule.hasOne(Exam, {
  foreignKey: 'moduleId',
  as: 'exam',
  onDelete: 'CASCADE',
});
Exam.belongsTo(TrainingModule, {
  foreignKey: 'moduleId',
  as: 'module',
});

ModuleChapter.hasMany(LearningMaterial, {
  foreignKey: 'chapterId',
  as: 'materials',
  onDelete: 'CASCADE',
});
LearningMaterial.belongsTo(ModuleChapter, {
  foreignKey: 'chapterId',
  as: 'chapter',
});

User.hasMany(UserChapterProgress, {
  foreignKey: 'userId',
  as: 'chapterProgress',
  onDelete: 'CASCADE',
});
UserChapterProgress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

ModuleChapter.hasMany(UserChapterProgress, {
  foreignKey: 'chapterId',
  as: 'progress',
  onDelete: 'CASCADE',
});
UserChapterProgress.belongsTo(ModuleChapter, {
  foreignKey: 'chapterId',
  as: 'chapter',
});

User.hasMany(UserMaterialProgress, {
  foreignKey: 'userId',
  as: 'materialProgress',
  onDelete: 'CASCADE',
});
UserMaterialProgress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

LearningMaterial.hasMany(UserMaterialProgress, {
  foreignKey: 'materialId',
  as: 'progress',
  onDelete: 'CASCADE',
});
UserMaterialProgress.belongsTo(LearningMaterial, {
  foreignKey: 'materialId',
  as: 'material',
});

ModuleChapter.hasMany(PracticeSession, {
  foreignKey: 'chapterId',
  as: 'practiceSessions',
});
PracticeSession.belongsTo(ModuleChapter, {
  foreignKey: 'chapterId',
  as: 'chapter',
});

Exam.hasMany(PracticeSession, {
  foreignKey: 'examId',
  as: 'attempts',
});
PracticeSession.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam',
});

Notification.belongsTo(TrainingModule, {
  foreignKey: 'moduleId',
  as: 'module',
});
TrainingModule.hasMany(Notification, {
  foreignKey: 'moduleId',
  as: 'notifications',
  onDelete: 'CASCADE',
});

Notification.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam',
});
Exam.hasMany(Notification, {
  foreignKey: 'examId',
  as: 'notifications',
  onDelete: 'CASCADE',
});

User.hasMany(UserNotificationRead, {
  foreignKey: 'userId',
  as: 'notificationReads',
  onDelete: 'CASCADE',
});
UserNotificationRead.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Notification.hasMany(UserNotificationRead, {
  foreignKey: 'notificationId',
  as: 'reads',
  onDelete: 'CASCADE',
});
UserNotificationRead.belongsTo(Notification, {
  foreignKey: 'notificationId',
  as: 'notification',
});

export {
  sequelize,
  User,
  PracticeSession,
  ScoreCategory,
  TrainingModule,
  ModuleChapter,
  LearningMaterial,
  Exam,
  UserChapterProgress,
  UserMaterialProgress,
  Notification,
  UserNotificationRead,
};
