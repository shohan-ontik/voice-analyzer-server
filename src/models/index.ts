import { sequelize } from '../config/database';
import { User, initUserModel } from './user.model';
import { PracticeSession, initPracticeSessionModel } from './practiceSession.model';
import { Topic, initTopicModel } from './topic.model';

initUserModel(sequelize);
initPracticeSessionModel(sequelize);
initTopicModel(sequelize);

User.hasMany(PracticeSession, {
  foreignKey: 'userId',
  as: 'practiceSessions',
  onDelete: 'CASCADE',
});
PracticeSession.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { sequelize, User, PracticeSession, Topic };
