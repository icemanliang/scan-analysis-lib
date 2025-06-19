const { existsSync, mkdirSync, rmSync } = require('fs');
const path = require('path');
const { Level } = require('level');

class LevelDbStore {
  constructor(options) {
    this.name = '';
    this.dbs = {};
    this.basePath = options?.path || '.jscpd';
  }

  ensureDirSync(dir) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  removeDirSync(dir) {
    try {
      if (existsSync(dir)){
        rmSync(dir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error(`Failed to remove directory ${dir}:`, e);
    }
  }

  namespace(name) {
    this.name = name;

    if (!(name in this.dbs)) {
      const dbPath = path.join(this.basePath, name);
      // 不能立即删除目录，Level 会自行初始化；无需提前删除旧目录
      this.ensureDirSync(dbPath);
      this.dbs[name] = new Level(dbPath);
    }
  }

  // 获取数据
  async get(key) {
    const raw = await this.dbs[this.name].get(key);
    return JSON.parse(raw);
  }

  // 设置数据
  async set(key, value) {
    await this.dbs[this.name].put(key, JSON.stringify(value));
    return value;
  }

  // 关闭并清理所有数据库和目录
  async close() {
    for (const [name, db] of Object.entries(this.dbs)) {
      const dbPath = path.join(this.basePath, name);

      try {
        await db.close();                 // 等待数据库关闭
        this.removeDirSync(dbPath);       // 删除子目录
      } catch (err) {
        console.error(`Error closing DB "${name}":`, err);
      }
    }

    try {
      this.removeDirSync(this.basePath);  // 删除整个存储目录
    } catch (err) {
      console.error(`Error removing base path "${this.basePath}":`, err);
    }
  }
}

module.exports = LevelDbStore;
