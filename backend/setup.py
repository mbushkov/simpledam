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
        "aiosqlite==0.12.0"
        "bson==0.5.9",
        "imagecodecs==2021.2.26",  # implicit dependency of tifffile
        "pillow-simd==7.0.0.post3",
        "portpicker==1.3.1",
        "rawpy==0.15.0",
        "tifffile==2021.3.17",
    ],
    extras_require={
        "dev": ["pyinstaller==3.6"],
    },
    data_files=[],
)

setup(**setup_args)