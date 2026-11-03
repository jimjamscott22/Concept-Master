from datetime import date, timedelta
import logging

from daily_concept.graph import ConceptDef, Domain
from daily_concept.selection import RecentLesson, select_concept


TODAY = date(2026, 11, 2)


def concept(id, domain="python", difficulty=2, **kwargs):
    return ConceptDef(id=id, title=id, domain=domain, difficulty=difficulty, **kwargs)


def lesson(id="old", days=1, domain=Domain.PYTHON, difficulty=2, completed=True):
    when = TODAY - timedelta(days=days)
    return RecentLesson(id, when, domain, difficulty, when if completed else None)


def choose(graph, taught=(), reserved=(), recent=()):
    return select_concept(TODAY, taught, reserved, recent, graph)


def test_deterministic_regardless_of_input_order():
    graph = [concept("a"), concept("b"), concept("c")]
    recent = [lesson("x", days=1), lesson("y", days=2)]
    expected = choose(graph, recent=recent)
    assert all(choose(graph, recent=recent) == expected for _ in range(5))
    assert choose(list(reversed(graph)), recent=list(reversed(recent))) == expected


def test_domain_rotation_checks_both_previous_days():
    graph = [concept("a", "python"), concept("b", "web"), concept("c", "security")]
    assert choose(graph, recent=[lesson(), lesson("older", days=2, domain=Domain.WEB)]) == "c"


def test_domain_rotation_uses_calendar_days_not_old_lessons():
    graph = [concept("a", "python", 2), concept("b", "web", 5)]
    assert choose(graph, recent=[lesson(days=3)]) == "a"


def test_difficulty_default_is_two():
    assert choose([concept("a", difficulty=3), concept("b", difficulty=4)]) == "a"


def test_recent_difficulty_average_and_ramp():
    assert choose([concept("a", difficulty=1), concept("b", difficulty=4)],
                  recent=[lesson(difficulty=4)]) == "b"


def test_difficulty_uses_last_seven_and_ignores_future():
    recent = [lesson(str(day), days=day, difficulty=4) for day in range(1, 8)]
    recent += [lesson("ancient", days=8, difficulty=1), lesson("future", days=-1, difficulty=1)]
    assert choose([concept("a", difficulty=1), concept("b", difficulty=5)], recent=recent) == "b"


def test_prerequisite_gating_beats_high_score():
    graph = [concept("root", "python"), concept("child", "security", prerequisites=["root"])]
    assert choose(graph, recent=[lesson()]) == "root"
    assert choose(graph, taught={"root"}) == "child"


def test_reserved_prerequisite_does_not_count_as_taught():
    graph = [concept("root"), concept("other"), concept("child", "security", prerequisites=["root"])]
    assert choose(graph, reserved={"root"}, recent=[lesson()]) == "other"


def test_recent_completed_relation_adds_a_point():
    graph = [concept("a", related=["old"]), concept("b")]
    assert choose(graph, taught={"old"}, recent=[lesson()]) == "a"


def test_old_scheduled_lesson_completed_recently_counts_for_relation():
    history = RecentLesson("old", TODAY - timedelta(days=30), Domain.PYTHON, 2,
                           TODAY - timedelta(days=1))
    assert choose([concept("a", related=["old"]), concept("b")],
                  taught={"old"}, recent=[history]) == "a"


def test_uncompleted_or_stale_relations_do_not_change_tie_break():
    baseline = choose([concept("a"), concept("b")], recent=[lesson(completed=False)])
    other = "b" if baseline == "a" else "a"
    graph = [concept("a", related=["old"] if other == "a" else []),
             concept("b", related=["old"] if other == "b" else [])]
    assert choose(graph, recent=[lesson(completed=False)]) == baseline
    assert choose(graph, taught={"old"}, recent=[lesson(days=8)]) == choose(
        [concept("a"), concept("b")], taught={"old"}, recent=[lesson(days=8)])


def test_fallback_chooses_lowest_unreserved_difficulty(caplog):
    graph = [concept("root"), concept("a", difficulty=3, prerequisites=["root"]),
             concept("b", difficulty=4, prerequisites=["root"])]
    with caplog.at_level(logging.WARNING):
        assert choose(graph, reserved={"root"}) == "a"
    assert "prerequisite fallback" in caplog.text


def test_exhaustion_distinct_from_reservation_saturation(caplog):
    with caplog.at_level(logging.INFO):
        assert choose([concept("a")], taught={"a"}) is None
    assert "graph exhausted" in caplog.text
    caplog.clear()
    with caplog.at_level(logging.INFO):
        assert choose([concept("a")], reserved={"a"}) is None
    assert "reservations saturated" in caplog.text
    assert "graph exhausted" not in caplog.text


def test_selection_does_not_mutate_inputs():
    graph = [concept("a"), concept("b")]
    taught, reserved, recent = set(), {"a"}, [lesson()]
    assert choose(graph, taught, reserved, recent) == "b"
    assert [c.id for c in graph] == ["a", "b"]
    assert taught == set() and reserved == {"a"} and recent == [lesson()]
