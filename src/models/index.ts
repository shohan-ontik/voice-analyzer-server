import { sequelize } from '../config/database';
import { User, initUserModel } from './user.model';
import { PracticeSession, initPracticeSessionModel } from './practiceSession.model';
import { Topic, initTopicModel } from './topic.model';
import { ScoreCategory, initScoreCategoryModel } from './scoreCategory.model';

initUserModel(sequelize);
initPracticeSessionModel(sequelize);
initTopicModel(sequelize);
initScoreCategoryModel(sequelize);

User.hasMany(PracticeSession, {
  foreignKey: 'userId',
  as: 'practiceSessions',
  onDelete: 'CASCADE',
});
PracticeSession.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { sequelize, User, PracticeSession, Topic, ScoreCategory };
