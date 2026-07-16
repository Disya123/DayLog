import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Пользователь
  const user = await prisma.user.upsert({
    where: { email: 'demo@daylog.app' },
    update: {},
    create: {
      email: 'demo@daylog.app',
      name: 'Алина Воронов',
      passwordHash,
    },
  });

  // 2. Календарь со днями и задачами
  const calendar = await prisma.calendar.create({
    data: {
      ownerId: user.id,
      title: 'Спринт 14 — Платформа аналитики',
      description: 'Дневник работ по развитию внутренней BI-платформы.',
      color: '#10b981',
      days: {
        create: [
          {
            date: new Date('2026-07-13T00:00:00.000Z'),
            description: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Старт спринта. Согласовали scope с product.' }],
                },
              ],
            },
            tasks: {
              create: [
                { title: 'Ревью бэклога с командой', done: true, order: 0 },
                { title: 'Декомпозировать эпик E-214', done: false, order: 1 },
                { title: 'Оценить задачи в story points', done: false, order: 2 },
              ],
            },
          },
          {
            date: new Date('2026-07-14T00:00:00.000Z'),
            description: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Работа над ETL-пайплайном. Нашли узкое место в джобе измерений.' }],
                },
              ],
            },
            tasks: {
              create: [
                { title: 'Профилировать джобу измерений', done: true, order: 0 },
                { title: 'Перевести materialized view на incremental', done: false, order: 1 },
              ],
            },
          },
          {
            date: new Date('2026-07-15T00:00:00.000Z'),
            tasks: {
              create: [
                { title: 'PR-ревью для Игоря (ETL)', done: false, order: 0 },
                { title: 'Созвон с data-командой в 15:00', done: false, order: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // 3. Второй календарь
  await prisma.calendar.create({
    data: {
      ownerId: user.id,
      title: 'Личные рабочие задачи',
      description: 'Административные и мелкие задачи вне спринтов.',
      color: '#0ea5e9',
    },
  });

  // 4. Share-ссылка для первого календаря
  await prisma.shareLink.create({
    data: { calendarId: calendar.id },
  });

  console.log('Seed completed: demo@daylog.app / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
