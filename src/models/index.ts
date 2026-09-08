import { sequelize } from '../config/database';
import { User, initUserModel } from './user.model';
import { PracticeSession, initPracticeSessionModel } from './practiceSession.model';
import { Topic, initTopicModel } from './topic.model';
import { ScoreCategory, initScoreCategoryModel } from './scoreCategory.model';
import { TrainingModule, initModuleModel } from './module.model';
import { ModuleChapter, initModuleChapterModel } from './moduleChapter.model';
import { LearningMaterial, initLearningMaterialModel } from './learningMaterial.model';
import { Exam, initExamModel } from './exam.model';
import { UserChapterProgress, initUserChapterProgressModel } from './userChapterProgress.model';

initUserModel(sequelize);
initPracticeSessionModel(sequelize);
initTopicModel(sequelize);
initScoreCategoryModel(sequelize);
initModuleModel(sequelize);
initModuleChapterModel(sequelize);
initLearningMaterialModel(sequelize);
initExamModel(sequelize);
initUserChapterProgressModel(sequelize);

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

export {
  sequelize,
  User,
  PracticeSession,
  Topic,
  ScoreCategory,
  TrainingModule,
  ModuleChapter,
  LearningMaterial,
  Exam,
  UserChapterProgress,
};
