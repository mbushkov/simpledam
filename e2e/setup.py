from setuptools import find_namespace_packages
from setuptools import setup

setup_args = dict(
    name="newmedia_e2e",
    version="0.0.1",
    license="Apache License, Version 2.0",
    maintainer="Misha Bushkov",
    maintainer_email="realbushman@gmail.com",
    packages=find_namespace_packages(),
    install_requires=[
        "selenium==3.141.0",
        "pytest==6.2.5",
    ],
    data_files=[(
        "newmedia_e2e/assets",
        ["newmedia_e2e/assets/jquery-3.5.1.min.js"],
    )],
    include_package_data=True,
)

setup(**setup_args)