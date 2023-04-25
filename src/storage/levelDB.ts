import LevelUP from 'levelup';
import LevelDOWN from 'leveldown';

export interface levelDBAllResult<VT = any> {
  [key: string]: VT
}

export default class LevelDB {
  private db: LevelUP = null
  private dbName: string = './mydb/levelDB'

  constructor () {
    try {
      // connect to DB
      this.db = LevelUP(LevelDOWN(this.dbName));
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  // insert or update
  async add(prefix: string, key: string, value: any): Promise<void> {
    const dbKey: string = prefix + "_" + key
    const dbValue: string = JSON.stringify(value)

    await this.db.put(dbKey, dbValue);
  }

  // query
  async get(prefix: string, key: string): Promise<any> {
    const dbKey: string = prefix + "_" + key

    const dbValue = await this.db.get(dbKey)
    return JSON.parse(dbValue.toString())
  }

  // query all
  async getAll(prefix: string): Promise<levelDBAllResult> {
    const dbPrefix: string = prefix + "_"
    const dbPrefixLT: string = dbPrefix + "~"

    let resultSet: levelDBAllResult = {}

    await this.db.createReadStream({ gt: dbPrefix, lt: dbPrefixLT })
      .on('data', (data) => {
        resultSet[data.key.toString().replace(dbPrefix, "")] = JSON.parse(data.value.toString())
      })
      .on('error', (err) => {
        console.error("Error reading data from LevelDB: ", err)
        throw new Error(err)
      })
      .on('end', () => {
        console.log("All data with prefix ", dbPrefix, " has been read")
      })

      return resultSet
  }

  // delete
  async delete(prefix: string, key: string): Promise<void> {
    const dbKey: string = prefix + "_" + key

    await this.db.del(dbKey)
  }

  async close() {
    // close the connect
    await this.db.close((err) => {
      if (err) {
        console.error('error: ', err);
      } else {
        console.log('levelDB has been disconnected');
      }
    })
  }
}
