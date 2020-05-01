from setuptools import find_namespace_packages
from setuptools import setup

setup_args = dict(
    name="newmedia",
    version="0.0.1",
    license="Apache License, Version 2.0",
    maintainer="Misha Bushkov",
    maintainer_email="realbushman@gmail.com",
    packages=find_namespace_packages(),
    entry_points={"console_scripts": ["newmedia_backend = newmedia.main:main",]},
    install_requires=[
        "aiohttp[speedups]==3.6.2",
        "aiojobs==0.2.2",
        "bson==0.5.9",
        "lsm-db==0.6.4",
        "opencv-python==4.2.0.34",
    ],
    data_files=[],
)

setup(**setup_args)