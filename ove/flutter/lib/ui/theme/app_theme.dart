import 'package:flutter/material.dart';

class AppTheme {
  static const Color _primary = Color(0xFFE8E8E8);
  static const Color _background = Color(0xFF0A0A0A);
  static const Color _surface = Color(0xFF1A1A1A);
  static const Color _onSurface = Color(0xFFD4D4D4);

  static ThemeData dark() => ThemeData.dark().copyWith(
        colorScheme: const ColorScheme.dark(
          primary: _primary,
          surface: _surface,
          onSurface: _onSurface,
        ),
        scaffoldBackgroundColor: _background,
        appBarTheme: const AppBarTheme(
          backgroundColor: _background,
          elevation: 0,
          titleTextStyle: TextStyle(
            color: _primary,
            fontSize: 18,
            fontWeight: FontWeight.w500,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: _primary,
            foregroundColor: Colors.black,
            minimumSize: const Size.fromHeight(56),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      );
}
