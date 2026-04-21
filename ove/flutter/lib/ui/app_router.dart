import 'package:go_router/go_router.dart';
import 'package:ove/ui/home/home_screen.dart';
import 'package:ove/ui/recording/recording_screen.dart';
import 'package:ove/ui/restatement/restatement_screen.dart';
import 'package:ove/ui/belief/belief_screen.dart';
import 'package:ove/ui/report/report_screen.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
    GoRoute(
      path: '/recording',
      builder: (_, state) {
        final sessionId = state.extra as String?;
        return RecordingScreen(sessionId: sessionId ?? '');
      },
    ),
    GoRoute(
      path: '/restatement/:sessionId',
      builder: (_, state) => RestatementScreen(
        sessionId: state.pathParameters['sessionId']!,
      ),
    ),
    GoRoute(
      path: '/belief/:sessionId',
      builder: (_, state) => BeliefScreen(
        sessionId: state.pathParameters['sessionId']!,
      ),
    ),
    GoRoute(
      path: '/report/:sessionId',
      builder: (_, state) => ReportScreen(
        sessionId: state.pathParameters['sessionId']!,
      ),
    ),
  ],
);
