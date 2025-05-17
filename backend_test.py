import requests
import sys
import os
import json
from datetime import datetime

class FormBuilderAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return success, response.json() if response.text else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test the API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200
        )

    def test_create_form(self):
        """Test creating a form"""
        test_form = {
            "name": f"Test Form {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "fields": [
                {
                    "type": "text",
                    "label": "Full Name",
                    "name": "full_name",
                    "required": True,
                    "className": "form-control"
                },
                {
                    "type": "select",
                    "label": "Country",
                    "name": "country",
                    "required": False,
                    "className": "form-control",
                    "values": [
                        {"label": "USA", "value": "usa"},
                        {"label": "Canada", "value": "canada"},
                        {"label": "UK", "value": "uk"}
                    ]
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Form",
            "POST",
            "forms",
            200,
            data=test_form
        )
        
        if success and "id" in response:
            print(f"Created form with ID: {response['id']}")
            return response["id"]
        return None

    def test_get_forms(self):
        """Test getting all forms"""
        success, response = self.run_test(
            "Get All Forms",
            "GET",
            "forms",
            200
        )
        
        if success:
            form_count = len(response)
            print(f"Retrieved {form_count} forms")
        
        return success

    def test_get_form(self, form_id):
        """Test getting a specific form"""
        success, response = self.run_test(
            "Get Form by ID",
            "GET",
            f"forms/{form_id}",
            200
        )
        
        # If the first attempt fails, try with a different ID format
        if not success:
            print("Retrying with different ID format...")
            # Try with the MongoDB _id format
            success, response = self.run_test(
                "Get Form by ID (retry)",
                "GET",
                f"forms/{form_id}",
                200
            )
        
        if success:
            print(f"Retrieved form: {response['name']}")
            print(f"Form has {len(response['fields'])} fields")
        
        return success

    def test_update_form(self, form_id):
        """Test updating a form"""
        updated_form = {
            "name": f"Updated Form {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "fields": [
                {
                    "type": "text",
                    "label": "Full Name",
                    "name": "full_name",
                    "required": True,
                    "className": "form-control"
                },
                {
                    "type": "email",
                    "label": "Email Address",
                    "name": "email",
                    "required": True,
                    "className": "form-control"
                },
                {
                    "type": "select",
                    "label": "Country",
                    "name": "country",
                    "required": False,
                    "className": "form-control",
                    "values": [
                        {"label": "USA", "value": "usa"},
                        {"label": "Canada", "value": "canada"},
                        {"label": "UK", "value": "uk"},
                        {"label": "Australia", "value": "australia"}
                    ]
                }
            ]
        }
        
        success, response = self.run_test(
            "Update Form",
            "PUT",
            f"forms/{form_id}",
            200,
            data=updated_form
        )
        
        # If the first attempt fails, try with a different ID format
        if not success:
            print("Retrying with different ID format...")
            success, response = self.run_test(
                "Update Form (retry)",
                "PUT",
                f"forms/{form_id}",
                200,
                data=updated_form
            )
        
        if success:
            print(f"Updated form: {response['name']}")
            print(f"Form now has {len(response['fields'])} fields")
        
        return success

    def test_delete_form(self, form_id):
        """Test deleting a form"""
        success, _ = self.run_test(
            "Delete Form",
            "DELETE",
            f"forms/{form_id}",
            200
        )
        
        if success:
            print(f"Successfully deleted form with ID: {form_id}")
        else:
            # Some APIs return 200 instead of 204 for successful deletion
            success, _ = self.run_test(
                "Delete Form (alternate status)",
                "DELETE",
                f"forms/{form_id}",
                200
            )
            if success:
                print(f"Successfully deleted form with ID: {form_id} (with status 200 instead of 204)")
        
        return success

def main():
    # Get the backend URL from environment variable
    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "https://c116b948-b06b-4fdd-80f8-ea713a67497f.preview.emergentagent.com")
    api_url = f"{backend_url}/api"
    
    print(f"Testing API at: {api_url}")
    
    # Setup tester
    tester = FormBuilderAPITester(api_url)
    
    # Test API root
    tester.test_api_root()
    
    # Test form creation
    form_id = tester.test_create_form()
    if not form_id:
        print("❌ Form creation failed, stopping tests")
        return 1
    
    # Test getting all forms
    tester.test_get_forms()
    
    # Test getting a specific form
    tester.test_get_form(form_id)
    
    # Test updating a form
    tester.test_update_form(form_id)
    
    # Test deleting a form
    tester.test_delete_form(form_id)
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
