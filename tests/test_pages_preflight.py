"""Publishing state must not confuse a successful build with a live website."""
from pathlib import Path
import sys, unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from pages_preflight import classify, EXPECTED_URL

class PublishingStateTests(unittest.TestCase):
    def test_missing_site_requires_initial_configuration(self):
        self.assertEqual(classify(404,{})['state'],'initial_configuration_required')
        self.assertFalse(classify(404,{})['ready'])
    def test_permission_error_is_not_reported_as_a_missing_site(self):
        self.assertEqual(classify(403,{})['state'],'configuration_check_failed')
    def test_server_failure_does_not_enable_publication(self):
        self.assertFalse(classify(503,{})['ready'])
    def test_legacy_source_requires_explicit_configuration(self):
        self.assertEqual(classify(200,{'build_type':'legacy','html_url':EXPECTED_URL})['state'],'workflow_source_required')
    def test_custom_origin_requires_build_review(self):
        self.assertEqual(classify(200,{'build_type':'workflow','html_url':'https://example.org/'})['state'],'origin_review_required')
    def test_exact_configuration_is_ready_but_not_claimed_deployed(self):
        result=classify(200,{'build_type':'workflow','html_url':EXPECTED_URL})
        self.assertTrue(result['ready'])
        self.assertEqual(result['state'],'configured')
    def test_optional_trailing_slash_is_accepted(self):
        self.assertTrue(classify(200,{'build_type':'workflow','html_url':EXPECTED_URL.rstrip('/')})['ready'])

if __name__=='__main__':
    unittest.main()
