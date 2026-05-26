from backend.sync_articles import SyncReport


def test_sync_report_format_shows_counts():
    r = SyncReport(inserted=2, updated=1, unchanged=5, deleted=0)
    text = r.format()
    assert "inserted:  2" in text
    assert "updated:   1" in text
    assert "unchanged: 5" in text
    assert "deleted:   0" in text


def test_sync_report_format_shows_warnings():
    r = SyncReport(warnings=["term 'foo': unknown category 'bar'"])
    text = r.format()
    assert "foo" in text
