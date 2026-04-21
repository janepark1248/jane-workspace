import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;

class DatabaseHelper {
  final String? dbPath;
  Database? _db;

  DatabaseHelper({this.dbPath});

  Future<Database> get database async {
    _db ??= await init();
    return _db!;
  }

  Future<Database> init() async {
    final path = dbPath ?? p.join(await getDatabasesPath(), 'ove.db');
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
    return _db!;
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        transcript TEXT,
        situation TEXT,
        thought TEXT,
        emotion TEXT,
        belief_choices TEXT,
        selected_choice TEXT,
        is_custom_input INTEGER,
        interpretation TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE action_items (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        text TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions (id)
      )
    ''');
    await db.execute('''
      CREATE TABLE follow_up_qa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        target_element TEXT NOT NULL,
        question TEXT NOT NULL,
        answer_transcript TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions (id)
      )
    ''');
  }

  Future<void> close() async => _db?.close();
}
